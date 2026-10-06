import { S3Storage } from "coze-coding-dev-sdk";

/**
 * 扣子编程自带对象存储。凭证由平台注入 process.env，不写本地 .env。
 */
let storage: S3Storage | null = null;

function getStorage(): S3Storage {
  if (!storage) storage = new S3Storage();
  return storage;
}

const PREFIX = "photo-questions/";

export function isPhotoObjectKey(key: string): boolean {
  return key.startsWith(PREFIX) && !key.includes("..");
}

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function uploadPhotoObject(
  bytes: Uint8Array,
  mime: string,
  studentId: number
): Promise<string> {
  const fileName = `${PREFIX}${studentId}/${Date.now()}.${extFromMime(mime)}`;
  const fileContent = Buffer.from(bytes);
  const uploaded = await getStorage().uploadFile({
    fileContent,
    fileName,
    contentType: mime,
  });
  return typeof uploaded === "string" && uploaded.trim() ? uploaded.trim() : fileName;
}

export async function readPhotoObject(key: string): Promise<Buffer> {
  if (key.includes("..")) {
    throw new Error("非法图片");
  }
  return getStorage().readFile({ fileKey: key });
}
