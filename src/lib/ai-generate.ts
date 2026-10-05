import "server-only";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { NextRequest } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export interface GeneratedSolution {
  answer: string;
  analysis: string;
}

/**
 * 调用大模型为一道分数乘法应用题生成标准答案与分步解析。
 * 生成的 JSON 形如 {"answer":"3/4","analysis":"..."}。
 */
export async function generateSolution(
  stem: string,
  questionType: string
): Promise<GeneratedSolution> {
  const config = new Config();
  const client = new LLMClient(config);

  const messages: Parameters<typeof client.invoke>[0] = [
    {
      role: "system",
      content:
        "你是一名经验丰富的小学六年级数学老师，擅长分数乘法应用题教学。你会收到一道人教版六年级上册分数乘法应用题，请给出标准答案与分步解析。要求：1) 答案为完整数值，能化简的分数写成最简分数形式（如 3/4），多问答案用顿号“、”分隔（如 2/3、1/4）；2) 解析分步骤书写，语言简洁、小学生能看懂，约 2~4 步；3) 只输出一个 JSON 对象，不要输出任何其他文字或 markdown 代码块，格式为 {\"answer\":\"...\",\"analysis\":\"...\"}。",
    },
    {
      role: "user",
      content: `题型：${questionType}\n题目：${stem}`,
    },
  ];

  const response = await client.invoke(messages, {
    model: "doubao-seed-2-0-pro-260215",
    temperature: 0.2,
  });

  const raw = response.content.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI 返回格式异常");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    answer: String(parsed.answer || "").trim(),
    analysis: String(parsed.analysis || "").trim(),
  };
}

/** 包装：可用于 API 路由，透传请求头以追踪 */
export function makeLLMClient(req: NextRequest) {
  const customHeaders = HeaderUtils.extractForwardHeaders(req.headers);
  return new LLMClient(new Config(), customHeaders);
}

/** 检查是否已有题目（按题干去重） */
export async function findQuestionByStem(stem: string) {
  const client = getSupabaseClient();
  const { data } = await client
    .from("questions")
    .select("id")
    .eq("stem", stem)
    .maybeSingle();
  return data;
}