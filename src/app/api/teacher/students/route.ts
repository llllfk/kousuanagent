import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-guard";
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
      .select("student_id, is_correct");
    if (recErr) throw new Error(recErr.message);

    const stats = new Map<number, { attempts: number; correct: number }>();
    for (const r of recs || []) {
      const s = stats.get(r.student_id) || { attempts: 0, correct: 0 };
      s.attempts += 1;
      if (r.is_correct) s.correct += 1;
      stats.set(r.student_id, s);
    }

    const data = (users || []).map((u) => ({
      id: u.id,
      name: u.name,
      created_at: u.created_at,
      attempts: stats.get(u.id)?.attempts || 0,
      correctRate: stats.get(u.id)?.attempts
        ? Math.round(((stats.get(u.id)?.correct || 0) / stats.get(u.id)!.attempts) * 100)
        : null,
    }));
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