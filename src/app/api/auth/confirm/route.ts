import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { sessionCookieHeaders } from "@/lib/session";

/** 同名用户中确认选择某个账号 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "无效的用户" }, { status: 400 });
    }
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("users")
      .select("id, name, role")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    const resp = NextResponse.json({ status: "ok", role: data.role, user: data });
    for (const c of sessionCookieHeaders(data)) resp.cookies.set(c.name, c.value, c);
    return resp;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "确认失败" }, { status: 500 });
  }
}