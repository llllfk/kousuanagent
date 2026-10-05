import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import RoleNav from "@/components/RoleNav";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "student") redirect("/teacher");

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleNav userName={user.name} role="student" />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">{children}</main>
    </div>
  );
}