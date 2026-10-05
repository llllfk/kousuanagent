import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-guard";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/** 学生本人练习记录 + 汇总统计 */
export async function GET() {
  try {
    const student = await requireStudent();
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("records")
      .select("*, questions(stem, question_type, difficulty, answer)")
      .eq("student_id", student.id)
      .order("practice_time", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = (data || []) as any[];

    // 逐题汇总
    const byQuestion = new Map<number, any>();
    for (const r of rows) {
      const q = r.questions;
      if (!byQuestion.has(r.question_id)) {
        byQuestion.set(r.question_id, {
          question_id: r.question_id,
          stem: q?.stem || "",
          question_type: q?.question_type || "",
          difficulty: q?.difficulty || "",
          attempts: 0,
          lastTime: "",
          everCorrect: false,
        });
      }
      const agg = byQuestion.get(r.question_id);
      agg.attempts += 1;
      if (r.is_correct) agg.everCorrect = true;
      if (!agg.lastTime || r.practice_time > agg.lastTime) agg.practice_time = r.practice_time;
    }

    const questionSummary = Array.from(byQuestion.values()).sort(
      (a, b) => new Date(b.practice_time).getTime() - new Date(a.practice_time).getTime()
    );

    const totalAttempts = rows.length;
    const correctAttempts = rows.filter((r) => r.is_correct).length;
    const answeredQuestions = byQuestion.size;
    const correctRate = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    return NextResponse.json({
      data: {
        details: rows.map((r) => ({
          id: r.id,
          question_id: r.question_id,
          stem: r.questions?.stem || "",
          question_type: r.questions?.question_type || "",
          difficulty: r.questions?.difficulty || "",
          student_answer: r.student_answer,
          is_correct: r.is_correct,
          guide_rounds: r.guide_rounds,
          attempt_number: r.attempt_number,
          practice_time: r.practice_time,
        })),
        questionSummary,
        stats: {
          totalAttempts,
          correctAttempts,
          answeredQuestions,
          correctRate,
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "查询失败" }, { status: 500 });
  }
}