"use server";

import { getSession, type SessionUser } from "@/lib/session";

export async function requireStudent(): Promise<SessionUser> {
  const user = await getSession();
  if (!user || user.role !== "student") {
    throw new Error("请先以学生身份登录");
  }
  return user;
}

export async function requireTeacher(): Promise<SessionUser> {
  const user = await getSession();
  if (!user || user.role !== "teacher") {
    throw new Error("请先以老师身份登录");
  }
  return user;
}