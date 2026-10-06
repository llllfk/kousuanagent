"use client";

import { useEffect, useState } from "react";

interface Student {
  id: number;
  name: string;
  created_at: string;
  attempts: number;
  correctRate: number | null;
}

export default function TeacherStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    const res = await fetch("/api/teacher/students");
    const json = await res.json();
    if (json.error) setError(json.error);
    else setStudents(json.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  async function addStudent() {
    if (!name.trim()) return;
    setError("");
    const res = await fetch("/api/teacher/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    if (json.error) setError(json.error);
    else {
      setName("");
      load();
    }
  }

  async function saveEdit() {
    if (!editing || !editName.trim()) return;
    const res = await fetch(`/api/teacher/students/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    const json = await res.json();
    if (json.error) setError(json.error);
    else {
      setEditing(null);
      load();
    }
  }

  async function remove(stu: Student) {
    if (!confirm(`确定删除学生「${stu.name}」吗？其练习记录也会一并删除。`)) return;
    const res = await fetch(`/api/teacher/students/${stu.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.error) setError(json.error);
    else load();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-1">学生管理</h1>
      <p className="text-slate-500 mb-6">创建学生账号，学生凭姓名即可登录练习。</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* 新增 */}
      <div className="bg-white rounded-3xl shadow p-4 mb-6 flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addStudent()}
          placeholder="新学生姓名"
          className="flex-1 rounded-2xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-sky-400 focus:outline-none"
        />
        <button
          onClick={addStudent}
          disabled={!name.trim()}
          className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-2xl px-6 py-3 font-semibold text-lg"
        >
          + 创建学生
        </button>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-3xl shadow overflow-hidden">
        {students.length === 0 ? (
          <p className="text-center text-slate-400 py-10">还没有学生，先在上面创建一个吧。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">姓名</th>
                  <th className="px-4 py-3">练习次数</th>
                  <th className="px-4 py-3">正确率</th>
                  <th className="px-4 py-3">创建时间</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-3">{s.attempts}</td>
                    <td className="px-4 py-3">{s.correctRate === null ? "-" : `${s.correctRate}%`}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(s.created_at).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => { setEditing(s); setEditName(s.name); }}
                        className="text-sky-500 hover:underline"
                      >
                        改名
                      </button>
                      <button onClick={() => remove(s)} className="text-rose-500 hover:underline">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-30">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-3">修该学生姓名</h2>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 mb-4 focus:border-sky-400 focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 bg-slate-100 rounded-2xl py-2">取消</button>
              <button onClick={saveEdit} className="flex-1 bg-sky-500 text-white rounded-2xl py-2">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}