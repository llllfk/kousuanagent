import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const qid = Number(id);
    if (!Number.isInteger(qid)) {
      return NextResponse.json({ error: "无效题目" }, { status: 400 });
    }
    const session = await getSession().catch(() => null);
    const isTeacher = session?.role === "teacher";
    // 学生端不泄露答案与解析
    const select = isTeacher
      ? "id, stem, answer, analysis, question_type, difficulty, created_at"
      : "id, stem, question_type, difficulty, created_at";
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("questions")
      .select(select)
      .eq("id", qid)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "查询失败" }, { status: 500 });
  }
}