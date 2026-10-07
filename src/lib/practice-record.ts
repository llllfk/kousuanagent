import { getSupabaseClient } from "@/storage/database/supabase-client";
import { normalizePhotoKey } from "@/storage/s3";

/** 拍题没有题库 id：复用/创建「拍题目」占位题 */
export async function ensurePhotoQuestionId(): Promise<number> {
  const client = getSupabaseClient();
  const existed = await client
    .from("questions")
    .select("id")
    .eq("question_type", "拍题目")
    .eq("stem", "拍题目")
    .maybeSingle();
  if (existed.error) throw new Error(existed.error.message);
  if (existed.data?.id) return existed.data.id as number;

  const created = await client
    .from("questions")
    .insert({
      stem: "拍题目",
      answer: "",
      analysis: "",
      question_type: "拍题目",
      difficulty: "简单",
    })
    .select("id")
    .single();
  if (created.error) throw new Error(created.error.message);
  return created.data.id as number;
}

/** 进入练习对话时落一条可查询记录（可不提交答案） */
export async function startPracticeRecord(opts: {
  studentId: number;
  questionId: number;
  conversationId: string;
  photoKey?: string;
}): Promise<void> {
  const client = getSupabaseClient();
  const { count, error: countErr } = await client
    .from("records")
    .select("*", { count: "exact", head: true })
    .eq("student_id", opts.studentId)
    .eq("question_id", opts.questionId);
  if (countErr) throw new Error(countErr.message);

  const { error } = await client.from("records").insert({
    student_id: opts.studentId,
    question_id: opts.questionId,
    student_answer: "",
    is_correct: false,
    guide_rounds: 0,
    attempt_number: (count ?? 0) + 1,
    practice_time: new Date().toISOString(),
    photo_key: normalizePhotoKey(opts.photoKey || ""),
    conversation_id: opts.conversationId,
  });
  if (error) throw new Error(error.message);
}

export function hasSubmittedAnswer(answer?: string | null): boolean {
  return Boolean((answer || "").toString().trim());
}
