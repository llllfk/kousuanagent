"use client";

import { useRouter, usePathname } from "next/navigation";

interface Props {
  userName: string;
  role: "student" | "teacher";
}

export default function RoleNav({ userName, role }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const studentLinks = [
    { href: "/student", label: "题目练习" },
    { href: "/student/records", label: "练习记录" },
  ];
  const teacherLinks = [
    { href: "/teacher", label: "学生管理" },
    { href: "/teacher/questions", label: "题库管理" },
    { href: "/teacher/records", label: "练习记录" },
  ];
  const links = role === "teacher" ? teacherLinks : studentLinks;

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const isActive = (href: string) => (href === "/student" || href === "/teacher") ? pathname === href : pathname.startsWith(href);

  return (
    <header className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sky-600 font-bold text-xl">
          <span>📐</span>
          <span className="hidden sm:inline">数学练习</span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => router.push(l.href)}
              className={`px-4 py-2 rounded-2xl text-lg font-medium transition ${
                isActive(l.href) ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-2 pl-3 border-l">
            <span className="bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-sm font-medium">
              {userName}{role === "teacher" ? "·老师" : "·同学"}
            </span>
            <button
              onClick={logout}
              className="text-sm text-slate-400 hover:text-red-500 px-2 py-1"
            >
              退出
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}