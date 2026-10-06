import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { isPhotoObjectKey, normalizePhotoKey, readPhotoObject } from "@/storage/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guessMime(key: string): string {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

/** 登录用户查看已存储的拍题照片 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const key = normalizePhotoKey(req.nextUrl.searchParams.get("key") || "");
    if (!key || !isPhotoObjectKey(key)) {
      return NextResponse.json({ error: "图片不存在" }, { status: 404 });
    }
    if (user.role === "student") {
      const ownPrefix = `photo-questions/${user.id}/`;
      const ownsByPath = key.startsWith(ownPrefix);
      if (!ownsByPath) {
        const client = getSupabaseClient();
        const owned = await client
          .from("records")
          .select("photo_key")
          .eq("student_id", user.id);
        if (owned.error) throw new Error(owned.error.message);
        const matched = (owned.data || []).some(
          (row: { photo_key?: string }) => normalizePhotoKey(row.photo_key || "") === key
        );
        if (!matched) {
          return NextResponse.json({ error: "无权查看" }, { status: 403 });
        }
      }
    }
    const buf = await readPhotoObject(key);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": guessMime(key),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "读取失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
