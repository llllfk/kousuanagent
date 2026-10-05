import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-guard";
import { generateSolution } from "@/lib/ai-generate";

/** 老师编辑题目时的 AI 辅助：生成答案与解析（不落库，返回给前端填表） */
export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const body = await req.json();
    const stem = (body?.stem || "").toString().trim();
    const questionType = (body?.questionType || "").toString().trim();
    if (!stem) {
      return NextResponse.json({ error: "请先输入题干" }, { status: 400 });
    }
    const sol = await generateSolution(stem, questionType);
    return NextResponse.json({ data: sol });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "AI 生成失败" }, { status: 500 });
  }
}