import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-guard";
import { createConversation } from "@/lib/coze";
import { initRounds } from "@/lib/rounds";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/** 进入某题时创建新会话（conversation_id），换题即新建 */
export async function POST(req: NextRequest) {
  try {
    await requireStudent();
    const body = await req.json();
    const questionId = Number(body?.questionId);
    if (!Number.isInteger(questionId)) {
      return NextResponse.json({ error: "缺少题目" }, { status: 400 });
    }
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

    const conversationId = await createConversation();
    initRounds(conversationId);
    return NextResponse.json({ conversationId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "创建会话失败" }, { status: 500 });
  }
}