import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-guard";
import { uploadCozeImage } from "@/lib/coze";
import { uploadPhotoObject } from "@/storage/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** 拍题目：把图片上传到扣子，随后练习页会把该图直接发给智能体 */
export async function POST(req: NextRequest) {
  try {
    const student = await requireStudent();
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "请先拍照或选择题目图片" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "图片太大，请控制在 4MB 以内" }, { status: 400 });
    }
    const mime = file.type || "image/jpeg";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json({ error: "请上传 jpg、png 或 webp 图片" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const [fileId, photoKey] = await Promise.all([
      uploadCozeImage(bytes, file.name || "question.jpg", mime),
      uploadPhotoObject(bytes, mime, student.id),
    ]);
    return NextResponse.json({ data: { fileId, photoKey } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "上传失败，请重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
