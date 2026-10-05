"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LoginUser {
  id: number;
  name: string;
  role: string;
}

type Mode = "student" | "teacher";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("student");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({
          name: targetName,
          role: mode,
          password: mode === "teacher" ? password : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        return;
      }
      if (data.status === "bad_password") {
        setMessage("老师密码不正确，请重试（默认密码：Admin123456）。");
        return;
      }
      if (data.status === "none") {
        setMessage(
          mode === "teacher"
            ? "未找到该姓名的老师账号，请确认名字是否正确。"
            : "未找到该姓名的学生账号，请老师先在“学生管理”中创建后再登录。"
        );
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

  function switchMode(next: Mode) {
    setMode(next);
    setCandidates([]);
    setMessage("");
    setPassword("");
  }

  function canSubmit() {
    if (!name.trim()) return false;
    return mode === "student" || password.trim().length > 0;
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

        {/* 模式切换：我是学生 / 我是老师 */}
        <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
          <button
            onClick={() => switchMode("student")}
            className={`flex-1 rounded-xl py-2.5 text-base font-semibold transition ${
              mode === "student" ? "bg-white text-sky-600 shadow" : "text-slate-500"
            }`}
          >
            我是学生
          </button>
          <button
            onClick={() => switchMode("teacher")}
            className={`flex-1 rounded-xl py-2.5 text-base font-semibold transition ${
              mode === "teacher" ? "bg-white text-orange-500 shadow" : "text-slate-500"
            }`}
          >
            我是老师
          </button>
        </div>

        {candidates.length === 0 ? (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              {mode === "teacher" ? "请输入老师姓名" : "请输入学生姓名"}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSubmit() && doLogin(name.trim())}
              placeholder={mode === "teacher" ? "例如：王老师" : "例如：小明"}
              className="w-full text-xl rounded-2xl border-2 border-slate-200 px-4 py-3 focus:border-sky-400 focus:outline-none"
            />

            {mode === "teacher" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-600 mb-2">老师密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canSubmit() && doLogin(name.trim())}
                  placeholder="默认：Admin123456"
                  className="w-full text-xl rounded-2xl border-2 border-slate-200 px-4 py-3 focus:border-orange-400 focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={() => canSubmit() && doLogin(name.trim())}
              disabled={loading || !canSubmit()}
              className={`mt-5 w-full text-white text-xl font-semibold rounded-2xl py-3 disabled:opacity-50 ${
                mode === "teacher" ? "bg-orange-500 hover:bg-orange-600" : "bg-sky-500 hover:bg-sky-600"
              }`}
            >
              {loading ? "登录中…" : mode === "teacher" ? "进入老师端" : "进入练习"}
            </button>

            {message && (
              <p className="mt-4 text-sm text-amber-700 bg-amber-50 rounded-xl p-3">{message}</p>
            )}
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