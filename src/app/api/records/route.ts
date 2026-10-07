import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-guard";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { hasReferenceAnswer, judge } from "@/lib/judge";
import { ensurePhotoQuestionId, hasSubmittedAnswer } from "@/lib/practice-record";
import { getRound } from "@/lib/rounds";
import { normalizePhotoKey } from "@/storage/s3";

/** 学生本人练习记录 + 汇总统计（含仅对话未提交答案） */
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

    const byQuestion = new Map<number, any>();
    for (const r of rows) {
      const q = r.questions;
      const judged = hasReferenceAnswer(q?.answer);
      const submitted = hasSubmittedAnswer(r.student_answer);
      if (!byQuestion.has(r.question_id)) {
        byQuestion.set(r.question_id, {
          question_id: r.question_id,
          stem: q?.stem || "",
          question_type: q?.question_type || "",
          difficulty: q?.difficulty || "",
          attempts: 0,
          lastTime: "",
          everCorrect: false,
          judged,
          submitted: false,
        });
      }
      const agg = byQuestion.get(r.question_id);
      agg.attempts += 1;
      if (r.is_correct) agg.everCorrect = true;
      if (submitted) agg.submitted = true;
      if (!agg.lastTime || r.practice_time > agg.lastTime) agg.practice_time = r.practice_time;
    }

    const questionSummary = Array.from(byQuestion.values()).sort(
      (a, b) => new Date(b.practice_time).getTime() - new Date(a.practice_time).getTime()
    );

    const totalAttempts = rows.length;
    const submittedRows = rows.filter((r) => hasSubmittedAnswer(r.student_answer));
    const judgedRows = submittedRows.filter((r) => hasReferenceAnswer(r.questions?.answer));
    const correctAttempts = judgedRows.filter((r) => r.is_correct).length;
    const answeredQuestions = byQuestion.size;
    const correctRate = judgedRows.length ? Math.round((correctAttempts / judgedRows.length) * 100) : 0;

    return NextResponse.json({
      data: {
        details: rows.map((r) => ({
          id: r.id,
          question_id: r.question_id,
          stem: r.questions?.stem || "",
          question_type: r.questions?.question_type || "",
          difficulty: r.questions?.difficulty || "",
          student_answer: r.student_answer || "",
          is_correct: r.is_correct,
          judged: hasReferenceAnswer(r.questions?.answer),
          submitted: hasSubmittedAnswer(r.student_answer),
          photo_key: normalizePhotoKey(r.photo_key || ""),
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
          submittedAttempts: submittedRows.length,
        },
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "查询失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** 提交答案：更新对话时已创建的记录；没有会话记录时再新建 */
export async function POST(req: NextRequest) {
  try {
    const student = await requireStudent();
    const body = await req.json();
    const conversationId = (body?.conversationId || "").toString().trim();
    const studentAnswer = (body?.studentAnswer || "").toString().trim();
    const photo = body?.photo === true;
    const photoKey = (body?.photoKey || "").toString().trim();
    let questionId = Number(body?.questionId);

    if (!studentAnswer) {
      return NextResponse.json({ error: "请填写答案" }, { status: 400 });
    }

    const client = getSupabaseClient();

    if (photo || !Number.isInteger(questionId) || questionId <= 0) {
      questionId = await ensurePhotoQuestionId();
    }

    const { data: q, error: qErr } = await client
      .from("questions")
      .select("id, answer")
      .eq("id", questionId)
      .maybeSingle();
    if (qErr) throw new Error(qErr.message);
    if (!q) return NextResponse.json({ error: "题目不存在" }, { status: 404 });

    const answerText = typeof q.answer === "string" ? q.answer : "";
    const isCorrect = hasReferenceAnswer(answerText)
      ? judge(answerText, studentAnswer).result === "正确"
      : false;
    const guideRounds = conversationId ? getRound(conversationId) : 0;
    const now = new Date().toISOString();
    const key = photo ? normalizePhotoKey(photoKey) : "";

    if (conversationId) {
      const existed = await client
        .from("records")
        .select("id")
        .eq("student_id", student.id)
        .eq("conversation_id", conversationId)
        .maybeSingle();
      if (existed.error) throw new Error(existed.error.message);
      if (existed.data?.id) {
        const updates: Record<string, unknown> = {
          student_answer: studentAnswer,
          is_correct: isCorrect,
          guide_rounds: guideRounds,
          practice_time: now,
        };
        if (key) updates.photo_key = key;
        const { error: updErr } = await client
          .from("records")
          .update(updates)
          .eq("id", existed.data.id);
        if (updErr) throw new Error(updErr.message);
        return NextResponse.json({ status: "ok" });
      }
    }

    const { count, error: countErr } = await client
      .from("records")
      .select("*", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("question_id", q.id);
    if (countErr) throw new Error(countErr.message);

    const { error: insErr } = await client.from("records").insert({
      student_id: student.id,
      question_id: q.id,
      student_answer: studentAnswer,
      is_correct: isCorrect,
      guide_rounds: guideRounds,
      attempt_number: (count ?? 0) + 1,
      practice_time: now,
      photo_key: key,
      conversation_id: conversationId,
    });
    if (insErr) throw new Error(insErr.message);

    return NextResponse.json({ status: "ok" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "提交失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
