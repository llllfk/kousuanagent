import "server-only";

/**
 * 扣子智能体（Bot）对话封装。
 * 仅负责通过 HTTP OpenAPI 调用外部智能体话术，不做业务判分。
 * bot_id 与访问令牌一律通过环境变量读取，严禁硬编码。
 *
 * 说明：智能体提示词中定义了占位变量（question / reference_answer /
 * analysis / judge_result / round_count / student_name）。若智能体已在
 * 扣子后台声明这些 Bot 变量，可经 /v3/chat 的 custom_variables 注入；
 * 若未声明（variables 为空），custom_variables 会被扣子以 4000 拒绝。
 * 为兼容两种场景，这里默认把变量以"系统上下文消息"方式随每次请求注入，
 * 保证对话师始终拿到当前题目、答案、判分、轮次与学生姓名。
 */

const baseUrl = () => (process.env.COZE_API_BASE_URL || "https://api.coze.cn").replace(/\/+$/, "");

export function getCozeToken(): string {
  const token = process.env.COZE_WORKLOAD_API_TOKEN;
  if (!token) throw new Error("未配置 COZE_WORKLOAD_API_TOKEN");
  return token;
}

export function getCozeBotId(): string {
  const id = process.env.COZE_BOT_ID;
  if (!id) throw new Error("未配置 COZE_BOT_ID");
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

/** 将占位变量渲染为系统上下文文本（bot variables 不可用时兜底注入） */
function buildSystemContext(v: BotVariables): string {
  return [
    "【练习上下文】（仅供你作为引导老师参考，不要直接念出完整答案或完整解析；你的职责是用提问启发学生思考）",
    `- 当前题目：${v.question}`,
    `- 标准答案：${v.reference_answer}`,
    `- 分步解析：${v.analysis}`,
    `- 本次判分结果：${v.judge_result}`,
    `- 当前引导轮次：第 ${v.round_count} 轮`,
    `- 学生姓名：${v.student_name}`,
  ].join("\n");
}

/** 创建新会话（进入一道题时调用），返回 conversation_id */
export async function createConversation(): Promise<string> {
  const resp = await fetch(`${baseUrl()}/v1/conversation/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ bot_id: getCozeBotId() }),
  });
  const json = await resp.json();
  if (json.code !== 0 || !json.data?.id) {
    throw new Error(`创建会话失败: ${json.code} ${json.msg || ""}`);
  }
  return json.data.id;
}

/**
 * 发起流式对话，返回浏览器端可读的 SSE ReadableStream。
 * 将扣子 SSE 增量解析后转发为标准事件：token / done / error。
 */
export function streamChat(opts: {
  conversationId: string;
  userId: string;
  message: string;
  variables: BotVariables;
}): ReadableStream<Uint8Array> {
  const { conversationId, userId, message, variables } = opts;
  const encoder = new TextEncoder();
  // 跨 chunk 的 SSE 行缓冲（闭包持有）
  let sseBuffer = "";

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk, { stream: true });
      sseBuffer += text;
      let idx: number;
      while ((idx = sseBuffer.indexOf("\n")) >= 0) {
        const line = sseBuffer.slice(0, idx);
        sseBuffer = sseBuffer.slice(idx + 1);
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const raw = trimmed.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        let data: any;
        try {
          data = JSON.parse(raw);
        } catch {
          continue;
        }
        if (data.type === "answer") {
          const content = data.content || "";
          if (content) {
            controller.enqueue(
              encoder.encode(`event: token\ndata: ${JSON.stringify({ text: content })}\n\n`)
            );
          }
        } else if (data.type === "error" || data.status === "failed") {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ text: data.msg || "智能体暂时开小差了，请稍后再试" })}\n\n`
            )
          );
        }
      }
    },
    flush(controller) {
      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
    },
  });

  const params = new URLSearchParams({ conversation_id: conversationId });
  const systemMsg =
    process.env.COZE_USE_VARIABLES === "true"
      ? undefined
      : { role: "system", content: buildSystemContext(variables), content_type: "text" };

  (async () => {
    try {
      const resp = await fetch(`${baseUrl()}/v3/chat?${params.toString()}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          bot_id: getCozeBotId(),
          user_id: userId,
          stream: true,
          auto_save_history: true,
          additional_messages: [
            { role: "user", content: message, content_type: "text" },
          ],
          ...(systemMsg ? { additional_messages: [systemMsg, { role: "user", content: message, content_type: "text" }] } : {}),
          ...(process.env.COZE_USE_VARIABLES === "true" ? { custom_variables: variables } : {}),
        }),
      });
      if (!resp.body) throw new Error("扣子无返回流");
      const reader = resp.body.getReader();
      const inner = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const writer = transformStream.writable.getWriter();
        await writer.write(encoder.encode(inner.decode(value, { stream: true })));
        writer.releaseLock();
      }
      await transformStream.writable.getWriter().close();
    } catch (e: any) {
      try {
        const w = transformStream.writable.getWriter();
        await w.write(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ text: e?.message || "对话失败，请稍后再试" })}\n\n`
          )
        );
        w.releaseLock();
        await transformStream.writable.getWriter().close();
      } catch {}
    }
  })();

  return transformStream.readable;
}

/** 判断 bot 是否可用（校验配置） */
export function isConfigured(): boolean {
  return !!(process.env.COZE_BOT_ID && process.env.COZE_WORKLOAD_API_TOKEN);
}