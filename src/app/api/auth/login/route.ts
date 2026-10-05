import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { sessionCookieHeaders } from "@/lib/session";

/** 姓名登录：返回匹配用户列表，命中唯一则直接建立会话 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body?.name || "").toString().trim();
    if (!name) {
      return NextResponse.json({ error: "请输入姓名" }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("users")
      .select("id, name, role")
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