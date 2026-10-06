import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSession().catch(() => null);
  if (!user) redirect("/login");
  redirect(user.role === "teacher" ? "/teacher" : "/student");
  return null;
}