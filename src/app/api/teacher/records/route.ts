import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-guard";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { hasReferenceAnswer } from "@/lib/judge";
import { PHOTO_QUESTION_TYPE, isPhotoQuestion } from "@/lib/rounds";

/** 老师按学生 + 题型查看练习明细 */
export async function GET(req: NextRequest) {
  try {
    await requireTeacher();
    const sp = req.nextUrl.searchParams;
    const studentId = sp.get("studentId") ? Number(sp.get("studentId")) : null;
    const qtype = sp.get("questionType") || "";

    const client = getSupabaseClient();
    // 逐题/学生汇总记录
    let query = client
      .from("records")
      .select("*, questions(stem, question_type, difficulty, answer), users(name)")
      .order("practice_time", { ascending: false });
    if (studentId && Number.isInteger(studentId)) query = query.eq("student_id", studentId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let rows = (data || []) as any[];
    if (qtype === PHOTO_QUESTION_TYPE) {
      rows = rows.filter((r) => isPhotoQuestion(r.questions?.stem, r.questions?.question_type));
    } else if (qtype) {
      rows = rows.filter((r) => r.questions?.question_type === qtype);
    }

    // 汇总维度：学生 × 题目
    const map = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.student_id}_${r.question_id}`;
      const isCorrect = !!r.is_correct;
      if (!map.has(key)) {
        map.set(key, {
          student_id: r.student_id,
          student_name: r.users?.name || "",
          question_id: r.question_id,
          stem: r.questions?.stem || "",
          question_type: r.questions?.question_type || "",
          difficulty: r.questions?.difficulty || "",
          attempts: 0,
          correctAttempts: 0,
          guideRounds: [],
          lastTime: "",
          lastAnswer: "",
          lastPhotoKey: "",
          judged: hasReferenceAnswer(r.questions?.answer),
        });
      }
      const agg = map.get(key);
      agg.attempts += 1;
      if (isCorrect) agg.correctAttempts += 1;
      agg.guideRounds.push(r.guide_rounds);
      if (!agg.lastTime || r.practice_time > agg.lastTime) {
        agg.lastTime = r.practice_time;
        agg.lastAnswer = r.student_answer || "";
        agg.lastPhotoKey = r.photo_key || "";
      }
    }

    return NextResponse.json({
      data: Array.from(map.values()).sort(
        (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
      ),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "查询失败" }, { status: 500 });
  }
}