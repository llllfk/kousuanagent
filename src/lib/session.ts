import { cookies } from "next/headers";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export const UID_COOKIE = "app_uid";
export const ROLE_COOKIE = "app_role";

export interface SessionUser {
  id: number;
  name: string;
  role: "student" | "teacher";
}

/** 读取当前登录会话 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const uid = cookieStore.get(UID_COOKIE)?.value;
  if (!uid) return null;
  const id = Number(uid);
  if (!Number.isInteger(id)) return null;

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("users")
    .select("id, name, role")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`查询会话失败: ${error.message}`);
  if (!data) return null;
  return { id: data.id, name: data.name, role: data.role };
}

/** 构建设置会话 cookie 的响应头 */
export function sessionCookieHeaders(user: { id: number; role: string }) {
  return [
    {
      name: UID_COOKIE,
      value: String(user.id),
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
    {
      name: ROLE_COOKIE,
      value: user.role,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  ];
}

/** 清除会话 */
export function clearSessionCookieHeaders() {
  return [
    { name: UID_COOKIE, value: "", httpOnly: true, path: "/", maxAge: 0 },
    { name: ROLE_COOKIE, value: "", httpOnly: true, path: "/", maxAge: 0 },
  ];
}