import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-guard";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/** 老师新增题目 */
export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const body = await req.json();
    const stem = (body?.stem || "").toString().trim();
    const question_type = (body?.question_type || "").toString().trim();
    const difficulty = (body?.difficulty || "简单").toString().trim();
    const answer = (body?.answer || "").toString().trim();
    const analysis = (body?.analysis || "").toString().trim();

    if (!stem) {
      return NextResponse.json({ error: "请输入题干" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("questions")
      .insert({ stem, answer, analysis, question_type, difficulty })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
