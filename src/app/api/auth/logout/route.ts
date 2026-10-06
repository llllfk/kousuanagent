import { NextResponse } from "next/server";
import { clearSessionCookieHeaders } from "@/lib/session";

export async function POST() {
  const resp = NextResponse.json({ ok: true });
  for (const c of clearSessionCookieHeaders()) resp.cookies.set(c.name, c.value, c);
  return resp;
}