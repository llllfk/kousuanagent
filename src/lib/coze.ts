import "server-only";
import { loadEnv } from "@/storage/database/supabase-client";

/**
 * 扣子智能体（Bot）对话封装。
 * 话术与开场白一律来自智能体：题目/判分等通过 custom_variables 注入，
 * 不在前端或用户消息里写死引导文案。
 */

function ensureEnv(): void {
  loadEnv();
}

const baseUrl = () =>
  (process.env.AGENT_API_BASE_URL || "https://api.coze.cn").replace(/\/+$/, "");

export function getCozeToken(): string {
  ensureEnv();
  const token = process.env.AGENT_PAT;
  if (!token) throw new Error("未配置 AGENT_PAT");
  return token;
}

export function getCozeBotId(): string {
  ensureEnv();
  const id = process.env.BOT_ID;
  if (!id) throw new Error("未配置 BOT_ID");
  return id;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getCozeToken()}`,
    "Content-Type": "application/json",
  };
}

/** 智能体提示词中定义的占位变量 */
export interface BotVariables {
  question: string;
  reference_answer: string;
  analysis: string;
  judge_result: string; // 未答出/正确/部分正确/错误
  round_count: number;
  student_name: string;
}

interface CozeCreateConversationResponse {
  code?: number;
  msg?: string;
  data?: { id?: string };
}

interface CozeFileUploadResponse {
  code?: number;
  msg?: string;
  data?: { id?: string };
}

interface CozeBotGetResponse {
  code?: number;
  msg?: string;
  data?: {
    onboarding_info?: {
      prologue?: string;
      suggested_questions?: string[];
    };
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** 将题目与判分作为上下文交给智能体，话术仍由智能体生成 */
function buildPracticeContext(v: BotVariables): string {
  return [
    "【练习上下文】",
    `- 当前题目：${v.question}`,
    `- 标准答案：${v.reference_answer}`,
    `- 分步解析：${v.analysis}`,
    `- 本次判分结果：${v.judge_result}`,
    `- 当前引导轮次：第 ${v.round_count} 轮`,
    `- 学生姓名：${v.student_name}`,
  ].join("\n");
}

function useBotVariables(): boolean {
  return process.env.AGENT_USE_VARIABLES === "true";
}

function buildCustomVariables(variables: BotVariables): Record<string, string> {
  return {
    question: variables.question,
    reference_answer: variables.reference_answer,
    analysis: variables.analysis,
    judge_result: variables.judge_result,
    round_count: String(variables.round_count),
    student_name: variables.student_name,
  };
}

function buildUserMessage(
  message: string | undefined,
  turnType: "opening" | "message" | "submit",
  variables: BotVariables
): string {
  if (useBotVariables()) {
    if (turnType === "opening") return "开始练习";
    if (turnType === "submit") return `提交答案：${message ?? ""}`;
    return message ?? "";
  }
  const context = buildPracticeContext(variables);
  if (turnType === "opening") {
    return `${context}\n\n【开场】请根据以上题目，用引导老师的身份开场，一步步启发学生思考。不要直接给出完整答案。`;
  }
  if (turnType === "submit") {
    return `${context}\n\n【学生提交答案】\n${message ?? ""}`;
  }
  return `${context}\n\n【学生发言】\n${message ?? ""}`;
}

async function postCreateConversation(body: Record<string, string>): Promise<string> {
  const resp = await fetch(`${baseUrl()}/v1/conversation/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const json = (await resp.json()) as CozeCreateConversationResponse;
  if (json.code !== 0 || !json.data?.id) {
    throw new Error(`创建会话失败: ${json.code ?? resp.status} ${json.msg || ""}`.trim());
  }
  return json.data.id;
}

/** 创建新会话（进入一道题时调用），返回 conversation_id */
export async function createConversation(): Promise<string> {
  try {
    return await postCreateConversation({ bot_id: getCozeBotId() });
  } catch {
    // 智能体未发布到 API 渠道时，带 bot_id 创建会失败；先建空会话，对话时再绑定。
    return await postCreateConversation({});
  }
}

/** 读取智能体后台配置的开场白（不在前端写死） */
export async function getBotOnboarding(): Promise<string> {
  const botId = encodeURIComponent(getCozeBotId());
  const urls = [
    `${baseUrl()}/v1/bot/get?bot_id=${botId}`,
    `${baseUrl()}/v1/bots/${botId}`,
  ];
  for (const url of urls) {
    try {
      const resp = await fetch(url, { headers: headers() });
      const json = (await resp.json()) as CozeBotGetResponse;
      const prologue = json.data?.onboarding_info?.prologue;
      if (json.code === 0 && typeof prologue === "string" && prologue.trim()) {
        return prologue.trim();
      }
    } catch {
      // 换下一个接口再试
    }
  }
  return "";
}

function emitSse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: string,
  payload: Record<string, string>
): void {
  const encoder = new TextEncoder();
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
  );
}

function parseSseBlock(
  block: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): void {
  let eventName = "";
  const dataLines: string[] = [];
  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  const raw = dataLines.join("\n");
  if (!raw || raw === "[DONE]") return;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  if (eventName === "conversation.message.delta" && isRecord(data)) {
    // 不转发思考过程，只显示正式回复
    if (asString(data.type) === "answer") {
      const content = asString(data.content);
      if (content) emitSse(controller, "token", { text: content });
    }
    return;
  }

  if (eventName === "conversation.chat.failed" && isRecord(data)) {
    const msg =
      asString(data.last_error) ||
      (isRecord(data.last_error) ? asString(data.last_error.msg) : "") ||
      asString(data.msg) ||
      "智能体暂时开小差了，请稍后再试";
    emitSse(controller, "error", { text: msg });
    return;
  }

  if (eventName === "error" || (isRecord(data) && (asString(data.type) === "error" || asString(data.status) === "failed"))) {
    const msg = isRecord(data)
      ? asString(data.msg) || asString(data.message) || "智能体暂时开小差了，请稍后再试"
      : "智能体暂时开小差了，请稍后再试";
    emitSse(controller, "error", { text: msg });
  }
}

/**
 * 发起流式对话，返回浏览器端可读的 SSE ReadableStream。
 * 将扣子 SSE 增量解析后转发为标准事件：token / done / error。
 */
export function streamChat(opts: {
  conversationId: string;
  userId: string;
  message?: string;
  turnType?: "opening" | "message" | "submit";
  imageFileId?: string;
  variables: BotVariables;
}): ReadableStream<Uint8Array> {
  const { conversationId, userId, message, variables } = opts;
  const turnType = opts.turnType ?? (message ? "message" : "opening");

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const params = new URLSearchParams({ conversation_id: conversationId });
        const userContent = buildUserMessage(message, turnType, variables);
        if (!opts.imageFileId && !userContent.trim()) {
          throw new Error("对话内容为空");
        }
        // 拍题：图片直接作为消息发给智能体（object_string + file_id）
        const additionalMessages = opts.imageFileId
          ? [
              {
                role: "user",
                content_type: "object_string",
                content: JSON.stringify([
                  {
                    type: "text",
                    text:
                      turnType === "opening"
                        ? `学生姓名：${variables.student_name}\n请根据图片中的题目开始引导练习。`
                        : userContent,
                  },
                  { type: "image", file_id: opts.imageFileId },
                ]),
              },
            ]
          : [{ role: "user", content: userContent, content_type: "text" }];
        const body: Record<string, unknown> = {
          bot_id: getCozeBotId(),
          user_id: userId,
          stream: true,
          connector_id: "1024",
          auto_save_history: true,
          additional_messages: additionalMessages,
        };
        if (useBotVariables()) {
          body.custom_variables = buildCustomVariables(variables);
        }

        const resp = await fetch(`${baseUrl()}/v3/chat?${params.toString()}`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(body),
        });

        if (!resp.body) throw new Error("扣子无返回流");

        const contentType = resp.headers.get("content-type") || "";
        if (!resp.ok || contentType.includes("application/json")) {
          const text = await resp.text();
          let msg = `对话失败 (${resp.status})`;
          try {
            const json = JSON.parse(text) as { msg?: string; message?: string; code?: number };
            if (json.code === 4015) {
              msg = "智能体尚未发布到「Bot as API」渠道，请在扣子后台发布到 API 后再试";
            } else {
              msg = json.msg || json.message || msg;
            }
          } catch {
            if (text) msg = text.slice(0, 200);
          }
          throw new Error(msg);
        }

        const decoder = new TextDecoder();
        let buffer = "";
        const reader = resp.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            parseSseBlock(part, controller);
          }
        }
        if (buffer.trim()) parseSseBlock(buffer, controller);
        emitSse(controller, "done", {});
      } catch (error: unknown) {
        if (turnType === "opening") {
          const prologue = await getBotOnboarding();
          if (prologue) {
            emitSse(controller, "token", { text: prologue });
            emitSse(controller, "done", {});
            return;
          }
        }
        const text = error instanceof Error ? error.message : "对话失败，请稍后再试";
        emitSse(controller, "error", { text });
        emitSse(controller, "done", {});
      } finally {
        controller.close();
      }
    },
  });
}

/** 判断 bot 是否可用（校验配置） */
export function isConfigured(): boolean {
  ensureEnv();
  return !!(process.env.BOT_ID && process.env.AGENT_PAT);
}

/** 上传图片到扣子，返回 file_id（使用 AGENT_PAT） */
export async function uploadCozeImage(
  bytes: Uint8Array,
  filename: string,
  mime: string
): Promise<string> {
  const form = new FormData();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  form.append("file", new Blob([copy], { type: mime }), filename);
  const resp = await fetch(`${baseUrl()}/v1/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getCozeToken()}` },
    body: form,
  });
  const json = (await resp.json()) as CozeFileUploadResponse;
  if (json.code !== 0 || !json.data?.id) {
    throw new Error(`图片上传失败: ${json.msg || resp.status}`);
  }
  return json.data.id;
}
