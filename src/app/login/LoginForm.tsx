"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LoginUser {
  id: number;
  name: string;
  role: string;
}

export default function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<LoginUser[]>([]);
  const [message, setMessage] = useState("");

  async function doLogin(targetName: string) {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        return;
      }
      if (data.status === "none") {
        setMessage("未找到该姓名的账号，请老师先在“学生管理”中创建，或确认是否有拼写错误。");
        return;
      }
      if (data.status === "multiple") {
        setCandidates(data.users);
        return;
      }
      if (data.status === "ok") {
        redirectByRole(data.role);
      }
    } catch {
      setMessage("登录失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  async function confirmUser(id: number) {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        return;
      }
      if (data.status === "ok") redirectByRole(data.role);
    } catch {
      setMessage("确认失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  function redirectByRole(role: string) {
    router.push(role === "teacher" ? "/teacher" : "/student");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-amber-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📐</div>
          <h1 className="text-3xl font-bold text-slate-800">六年级数学练习</h1>
          <p className="text-slate-500 mt-2">分数乘法 · 引导式应用题练习</p>
        </div>

        {candidates.length === 0 ? (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">请输入你的姓名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && doLogin(name.trim())}
              placeholder="例如：小明"
              className="w-full text-xl rounded-2xl border-2 border-slate-200 px-4 py-3 focus:border-sky-400 focus:outline-none"
            />
            <button
              onClick={() => name.trim() && doLogin(name.trim())}
              disabled={loading || !name.trim()}
              className="mt-4 w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xl font-semibold rounded-2xl py-3"
            >
              {loading ? "登录中…" : "进入练习"}
            </button>
            {message && <p className="mt-4 text-sm text-amber-600 bg-amber-50 rounded-xl p-3">{message}</p>}
          </div>
        ) : (
          <div>
            <p className="text-slate-600 mb-3">找到多个同名的账号，请选择你的账号：</p>
            <div className="space-y-2">
              {candidates.map((u) => (
                <button
                  key={u.id}
                  onClick={() => confirmUser(u.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between rounded-2xl border-2 border-slate-200 px-4 py-3 hover:border-sky-400 hover:bg-sky-50"
                >
                  <span className="text-lg font-medium">{u.name}</span>
                  <span className="text-sm rounded-full px-3 py-1 bg-slate-100 text-slate-600">
                    {u.role === "teacher" ? "老师" : "学生"}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setCandidates([]);
                setName("");
              }}
              className="mt-4 text-sky-500 text-sm"
            >
              ← 返回重新输入
            </button>
          </div>
        )}
      </div>
    </div>
  );
}