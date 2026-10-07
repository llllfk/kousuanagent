import { NextRequest } from "next/server";
import { requireStudent } from "@/lib/auth-guard";
import { streamChat } from "@/lib/coze";
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
    const fileId = typeof body?.fileId === "string" ? body.fileId.trim() : "";
    const type: "opening" | "message" = body?.type === "opening" ? "opening" : "message";
    const content = (body?.content || "").toString().trim();
    const photoMode = body?.photo === true || fileId.length > 0;

    if (!conversationId || (type !== "opening" && !content) || (!photoMode && !Number.isInteger(questionId))) {
      return new Response(
        encoder.encode(
          `event: error\ndata: ${JSON.stringify({ text: "请求不完整" })}\n\n`
        ),
        { status: 200, headers: sseHeaders() }
      );
    }

    const client = getSupabaseClient();
    let stem = "（学生拍摄的题目，见图片）";
    let answer = "";
    let analysis = "";

    if (!photoMode) {
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
      stem = q.stem;
      answer = q.answer;
      analysis = q.analysis;
    }

    const roundCount = type === "opening" ? 0 : advanceRound(conversationId);
    if (type === "message" && roundCount > 0) {
      // 对话推进时同步轮次到练习记录，未提交答案也能看到引导轮次
      const { error: roundErr } = await client
        .from("records")
        .update({ guide_rounds: roundCount })
        .eq("student_id", student.id)
        .eq("conversation_id", conversationId);
      if (roundErr) {
        // 不影响对话本身
        console.error("update guide_rounds failed", roundErr.message);
      }
    }

    const variables = {
      question: stem,
      reference_answer: answer || "（未提供）",
      analysis: analysis || "（未提供）",
      judge_result: "未答出",
      round_count: roundCount,
      student_name: student.name,
    };

    const cozeStream = streamChat({
      conversationId,
      userId: `stu_${student.id}`,
      message: type === "opening" ? undefined : content,
      turnType: type,
      imageFileId: type === "opening" && photoMode ? fileId : undefined,
      variables,
    });

    const meta = {
      type,
      roundCount,
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
  } catch (e: unknown) {
    const encoderInner = new TextEncoder();
    const text = e instanceof Error ? e.message : "服务异常，请稍后再试";
    return new Response(
      encoderInner.encode(`event: error\ndata: ${JSON.stringify({ text })}\n\n`),
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

