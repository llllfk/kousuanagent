import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-guard";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { generateSolution } from "@/lib/ai-generate";

/** 老师新增题目（可由 AI 预生成答案解析，老师修改后保存） */
export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const body = await req.json();
    const stem = (body?.stem || "").toString().trim();
    const question_type = (body?.question_type || "").toString().trim();
    const difficulty = (body?.difficulty || "简单").toString().trim();
    let answer = (body?.answer || "").toString().trim();
    let analysis = (body?.analysis || "").toString().trim();

    if (!stem) {
      return NextResponse.json({ error: "请输入题干" }, { status: 400 });
    }

    // 若未提供答案/解析，调用 AI 生成
    if (!answer || !analysis) {
      try {
        const sol = await generateSolution(stem, question_type);
        if (!answer) answer = sol.answer;
        if (!analysis) analysis = sol.analysis;
      } catch {
        // AI 生成失败不阻断保存，答案/解析允许为空
      }
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("questions")
      .insert({ stem, answer, analysis, question_type, difficulty })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "创建失败" }, { status: 500 });
  }
}