import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { getSession } from "@/lib/session";

/** 题目列表：支持题型、难度筛选（学生端与老师端共用） */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const qtype = sp.get("type") || "";
    const difficulty = sp.get("difficulty") || "";
    const keyword = sp.get("keyword") || "";

    const session = await getSession().catch(() => null);
    const isTeacher = session?.role === "teacher";
    // 学生端不暴露答案与解析
    const select = isTeacher
      ? "id, stem, question_type, difficulty, created_at, answer, analysis"
      : "id, stem, question_type, difficulty, created_at";

    const client = getSupabaseClient();
    let query = client
      .from("questions")
      .select(select)
      .order("id", { ascending: true });
    if (qtype) query = query.eq("question_type", qtype);
    if (difficulty) query = query.eq("difficulty", difficulty);
    if (keyword) query = query.ilike("stem", `%${keyword}%`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const rows = (data || []).filter((q: { question_type?: string; stem?: string }) => {
      const type = q.question_type || "";
      const stem = q.stem || "";
      return type !== "拍题目" && !stem.startsWith("【拍题目】") && stem !== "拍题目";
    });
    return NextResponse.json({ data: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "查询失败" }, { status: 500 });
  }
}