import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { sessionCookieHeaders } from "@/lib/session";

/** 老师默认密码（可通过环境变量 COZE_TEACHER_PASSWORD 覆盖） */
const teacherPassword = process.env.COZE_TEACHER_PASSWORD || "Admin123456";

/**
 * 姓名登录：
 * - 学生模式（默认）：仅输入姓名，命中学生账号即登录
 * - 老师模式：点击“我是老师”后需输入姓名 + 密码
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body?.name || "").toString().trim();
    const mode = body?.role === "teacher" ? "teacher" : "student";

    if (!name) {
      return NextResponse.json({ error: "请输入姓名" }, { status: 400 });
    }
    if (mode === "teacher") {
      const pwd = (body?.password || "").toString();
      if (pwd !== teacherPassword) {
        return NextResponse.json({ status: "bad_password" });
      }
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("users")
      .select("id, name, role")
      .eq("role", mode)
      .eq("name", name)
      .order("id", { ascending: true });
    if (error) throw new Error(error.message);

    const users = (data || []) as { id: number; name: string; role: string }[];
    if (users.length === 0) {
      return NextResponse.json({ status: "none" });
    }
    if (users.length === 1) {
      const resp = NextResponse.json({ status: "ok", role: users[0].role, user: users[0] });
      for (const c of sessionCookieHeaders(users[0])) resp.cookies.set(c.name, c.value, c);
      return resp;
    }
    return NextResponse.json({
      status: "multiple",
      users: users.map((u) => ({ id: u.id, name: u.name, role: u.role })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "登录失败" }, { status: 500 });
  }
}