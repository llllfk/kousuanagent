import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-guard";
import { createConversation, isConfigured } from "@/lib/coze";
import { ensurePhotoQuestionId, startPracticeRecord } from "@/lib/practice-record";
import { initRounds } from "@/lib/rounds";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/** 进入某题时创建新会话，并立刻写入练习记录（无需提交答案即可查询） */
export async function POST(req: NextRequest) {
  try {
    const student = await requireStudent();
    if (!isConfigured()) {
      return NextResponse.json({ error: "未配置智能体 BOT_ID / AGENT_PAT" }, { status: 500 });
    }
    const body = await req.json();
    const photo = body?.photo === true;
    const photoKey = (body?.photoKey || "").toString();
    let questionId = Number(body?.questionId);
    if (!photo && !Number.isInteger(questionId)) {
      return NextResponse.json({ error: "缺少题目" }, { status: 400 });
    }

    const client = getSupabaseClient();
    if (photo) {
      questionId = await ensurePhotoQuestionId();
    } else {
      const { data, error } = await client
        .from("questions")
        .select("id")
        .eq("id", questionId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) {
        return NextResponse.json({ error: "题目不存在" }, { status: 404 });
      }
    }

    const conversationId = await createConversation();
    initRounds(conversationId);
    await startPracticeRecord({
      studentId: student.id,
      questionId,
      conversationId,
      photoKey: photo ? photoKey : "",
    });
    return NextResponse.json({ conversationId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "创建会话失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
