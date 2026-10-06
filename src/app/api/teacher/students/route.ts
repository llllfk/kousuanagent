import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-guard";
import { hasReferenceAnswer } from "@/lib/judge";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/** 学生列表（含每题练习次数统计） */
export async function GET() {
  try {
    await requireTeacher();
    const client = getSupabaseClient();
    const { data: users, error } = await client
      .from("users")
      .select("id, name, role, created_at")
      .eq("role", "student")
      .order("id", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: recs, error: recErr } = await client
      .from("records")
      .select("student_id, is_correct, questions(answer)");
    if (recErr) throw new Error(recErr.message);

    const stats = new Map<number, { attempts: number; judged: number; correct: number }>();
    for (const r of recs || []) {
      const rec = r as { student_id: number; is_correct: boolean; questions?: { answer?: string } };
      const s = stats.get(rec.student_id) || { attempts: 0, judged: 0, correct: 0 };
      s.attempts += 1;
      if (hasReferenceAnswer(rec.questions?.answer)) {
        s.judged += 1;
        if (rec.is_correct) s.correct += 1;
      }
      stats.set(rec.student_id, s);
    }

    const data = (users || []).map((u) => {
      const st = stats.get(u.id);
      return {
        id: u.id,
        name: u.name,
        created_at: u.created_at,
        attempts: st?.attempts || 0,
        correctRate: st?.judged
          ? Math.round(((st.correct || 0) / st.judged) * 100)
          : null,
      };
    });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "查询失败" }, { status: 500 });
  }
}

/** 新增学生账号 */
export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const body = await req.json();
    const name = (body?.name || "").toString().trim();
    if (!name) {
      return NextResponse.json({ error: "请输入姓名" }, { status: 400 });
    }
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("users")
      .insert({ name, role: "student" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "创建失败" }, { status: 500 });
  }
}