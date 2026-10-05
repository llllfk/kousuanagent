import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-guard";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id } = await ctx.params;
    const body = await req.json();
    const question_type = (body?.question_type || "").toString().trim();
    const difficulty = (body?.difficulty || "简单").toString().trim();
    const updates: Record<string, unknown> = {
      question_type,
      difficulty,
    };
    if (body.stem !== undefined) updates.stem = (body.stem || "").toString().trim();
    if (body.answer !== undefined) updates.answer = (body.answer || "").toString().trim();
    if (body.analysis !== undefined) updates.analysis = (body.analysis || "").toString().trim();

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("questions")
      .update(updates)
      .eq("id", Number(id))
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
    await client.from("records").delete().eq("question_id", Number(id));
    const { error } = await client.from("questions").delete().eq("id", Number(id));
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "删除失败" }, { status: 500 });
  }
}