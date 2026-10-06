import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-guard";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/** 修改 / 删除学生账号 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id } = await ctx.params;
    const body = await req.json();
    const name = (body?.name || "").toString().trim();
    if (!name) {
      return NextResponse.json({ error: "请输入姓名" }, { status: 400 });
    }
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("users")
      .update({ name })
      .eq("id", Number(id))
      .eq("role", "student")
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "更新失败" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id } = await ctx.params;
    const client = getSupabaseClient();
    // 先删记录，再删学生
    await client.from("records").delete().eq("student_id", Number(id));
    const { error } = await client.from("users").delete().eq("id", Number(id)).eq("role", "student");
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "删除失败" }, { status: 500 });
  }
}