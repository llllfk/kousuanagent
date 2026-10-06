import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-guard";
import { createConversation, isConfigured } from "@/lib/coze";
import { initRounds } from "@/lib/rounds";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/** 进入某题时创建新会话（conversation_id），换题即新建 */
export async function POST(req: NextRequest) {
  try {
    await requireStudent();
    if (!isConfigured()) {
      return NextResponse.json({ error: "未配置智能体 BOT_ID / AGENT_PAT" }, { status: 500 });
    }
    const body = await req.json();
    const photo = body?.photo === true;
    const questionId = Number(body?.questionId);
    if (!photo && !Number.isInteger(questionId)) {
      return NextResponse.json({ error: "缺少题目" }, { status: 400 });
    }
    if (!photo) {
      const client = getSupabaseClient();
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
    return NextResponse.json({ conversationId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "创建会话失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}