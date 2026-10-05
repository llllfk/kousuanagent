import { NextRequest } from "next/server";
import { requireStudent } from "@/lib/auth-guard";
import { streamChat } from "@/lib/coze";
import { judge } from "@/lib/judge";
import { advanceRound } from "@/lib/rounds";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  try {
    const student = await requireStudent();
    const body = await req.json();
    const questionId = Number(body?.questionId);
    const conversationId = (body?.conversationId || "").toString();
    const type: "message" | "submit" = body?.type === "submit" ? "submit" : "message";
    const content = (body?.content || "").toString().trim();

    if (!Number.isInteger(questionId) || !content || !conversationId) {
      return new Response(
        encoder.encode(
          `event: error\ndata: ${JSON.stringify({ text: "请求不完整" })}\n\n`
        ),
        { status: 200, headers: sseHeaders() }
      );
    }

    const client = getSupabaseClient();
    const { data: q, error: qErr } = await client
      .from("questions")
      .select("id, stem, answer, analysis, question_type")
      .eq("id", questionId)
      .maybeSingle();
    if (qErr) throw new Error(qErr.message);
    if (!q) {
      return new Response(
        encoder.encode(`event: error\ndata: ${JSON.stringify({ text: "题目不存在" })}\n\n`),
        { status: 200, headers: sseHeaders() }
      );
    }

    // 后端计数引导轮次（每次互动推进一轮）
    const roundCount = advanceRound(conversationId);

    // 判分逻辑：普通讨论=未答出；提交=正确/部分正确/错误
    let judgeResult = "未答出";
    let isCorrect = false;
    let attemptNumber = 1;
    let answer = "";
    let analysis = "";

    if (type === "submit") {
      const outcome = judge(q.answer, content);
      judgeResult = outcome.result;
      isCorrect = outcome.result === "正确";
      answer = q.answer;
      analysis = q.analysis;
      attemptNumber = await countAttempts(client, student.id, q.id);
      // 写入练习记录
      const { error: insErr } = await client.from("records").insert({
        student_id: student.id,
        question_id: q.id,
        student_answer: content,
        is_correct: isCorrect,
        guide_rounds: roundCount,
        attempt_number: attemptNumber,
        practice_time: new Date().toISOString(),
      });
      if (insErr) throw new Error(insErr.message);
    }

    const variables = {
      question: q.stem,
      reference_answer: q.answer || "（未提供）",
      analysis: q.analysis || "（未提供）",
      judge_result: judgeResult,
      round_count: roundCount,
      student_name: student.name,
    };

    const cozeStream = streamChat({
      conversationId,
      userId: `stu_${student.id}_r_${randomSuffix()}`,
      message: type === "submit" ? `[学生提交答案]${content}` : content,
      variables,
    });

    const meta = {
      type,
      judgeResult,
      isCorrect,
      attemptNumber,
      roundCount,
      solved: judgeResult === "正确",
      partCorrect: judgeResult === "部分正确",
      reference: judgeResult === "正确" ? answer : "",
      analysis: judgeResult === "正确" ? analysis : "",
    };

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify(meta)}\n\n`));
        const reader = cozeStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, { status: 200, headers: sseHeaders() });
  } catch (e: any) {
    const encoderInner = new TextEncoder();
    return new Response(
      encoderInner.encode(
        `event: error\ndata: ${JSON.stringify({ text: e?.message || "服务异常，请稍后再试" })}\n\n`
      ),
      { status: 200, headers: sseHeaders() }
    );
  }
}

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

async function countAttempts(client: any, studentId: number, questionId: number): Promise<number> {
  const { count, error } = await client
    .from("records")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("question_id", questionId);
  if (error) throw new Error(error.message);
  return (count ?? 0) + 1;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}