"use client";

import { useCallback, useEffect, useState } from "react";
import { DIFFICULTIES } from "@/lib/rounds";

interface Question {
  id: number;
  stem: string;
  answer: string;
  analysis: string;
  question_type: string;
  difficulty: string;
}

type QuestionForm = {
  stem: string;
  answer: string;
  analysis: string;
  question_type: string;
  difficulty: (typeof DIFFICULTIES)[number];
};

const emptyForm: QuestionForm = { stem: "", answer: "", analysis: "", question_type: "", difficulty: DIFFICULTIES[0] };

export default function TeacherQuestions() {
  const [list, setList] = useState<Question[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [modal, setModal] = useState<null | { form: typeof emptyForm; id?: number }>(null);
  const [formHint, setFormHint] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (difficulty) params.set("difficulty", difficulty);
    const res = await fetch(`/api/questions?${params.toString()}`);
    const json = await res.json();
    if (json.error) setError(json.error);
    else setList(json.data || []);
  }, [type, difficulty]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!modal) return;
    setError("");
    setSuccess("");
    setFormHint("");
    if (!modal.form.stem.trim()) {
      setFormHint("请输入题干");
      return;
    }
    const isEdit = !!modal.id;
    const url = isEdit ? `/api/teacher/questions/${modal.id}` : "/api/teacher/questions";
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stem: modal.form.stem,
        answer: modal.form.answer,
        analysis: modal.form.analysis,
        question_type: modal.form.question_type,
        difficulty: modal.form.difficulty,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; data?: Question };
    if (!res.ok || json.error) {
      const msg = json.error || "保存失败";
      setFormHint(msg);
      setError(msg);
      return;
    }
    setModal(null);
    setSuccess(isEdit ? "题目已更新" : "题目已新增");
    if (json.data && !isEdit) {
      setList((prev) => (prev.some((q) => q.id === json.data?.id) ? prev : [...prev, json.data]));
    }
    await load();
    window.setTimeout(() => setSuccess(""), 2500);
  }

  async function remove(q: Question) {
    if (!confirm(`确定删除这道题吗？相关练习记录也会删除。`)) return;
    const res = await fetch(`/api/teacher/questions/${q.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.error) setError(json.error);
    else load();
  }

  const typeOptions = Array.from(
    new Set([type, ...list.map((q) => q.question_type)].filter((t) => t && t !== "拍题目"))
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-1">题库管理</h1>
      <p className="text-slate-500 mb-6">共 {list.length} 道题。可新增、编辑题目，答案与解析由老师自行填写。</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && (
        <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700 font-medium">{success}</p>
      )}

      <div className="bg-white rounded-3xl shadow p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex flex-wrap gap-2 flex-1">
          <button onClick={() => setType("")} className={`px-4 py-2 rounded-full text-sm font-medium ${type === "" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}>全部</button>
          {typeOptions.map((t) => (
            <button key={t} onClick={() => setType(type === t ? "" : t)} className={`px-4 py-2 rounded-full text-sm font-medium ${type === t ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}>{t}</button>
          ))}
        </div>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-2xl border-2 border-slate-200 px-3 py-2">
          <option value="">全部难度</option>
          {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button
          onClick={() => {
            setFormHint("");
            setModal({ form: { ...emptyForm } });
          }}
          className="bg-amber-400 hover:bg-amber-500 text-white rounded-2xl px-6 py-3 font-semibold"
        >
          + 新增题目
        </button>
      </div>

      <div className="space-y-3">
        {list.map((q) => (
          <div key={q.id} className="bg-white rounded-3xl shadow p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs rounded-full px-3 py-1 bg-indigo-100 text-indigo-700">{q.question_type}</span>
                  <span className="text-xs rounded-full px-3 py-1 bg-amber-100 text-amber-700">{q.difficulty}</span>
                  <span className="text-xs rounded-full px-3 py-1 bg-emerald-100 text-emerald-700">答案：{q.answer}</span>
                </div>
                <p className="text-slate-800 leading-relaxed">{q.stem}</p>
                {q.analysis && <p className="text-slate-500 text-sm mt-2 whitespace-pre-wrap">解析：{q.analysis}</p>}
              </div>
              <div className="shrink-0 flex flex-col gap-1">
                <button onClick={() => { setFormHint(""); setModal({ id: q.id, form: { stem: q.stem, answer: q.answer, analysis: q.analysis, question_type: q.question_type, difficulty: q.difficulty as QuestionForm["difficulty"] } }); }} className="text-sky-500 text-sm">编辑</button>
                <button onClick={() => remove(q)} className="text-rose-500 text-sm">删除</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-30 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{modal.id ? "编辑题目" : "新增题目"}</h2>
            <label className="block text-sm font-medium text-slate-600 mb-1">题干</label>
            <textarea
              value={modal.form.stem}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, stem: e.target.value } })}
              rows={3}
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 mb-3 focus:border-sky-400 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">题型</label>
                <input
                  value={modal.form.question_type}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, question_type: e.target.value } })}
                  placeholder="自行填写，如：分数乘法"
                  className="w-full rounded-2xl border-2 border-slate-200 px-3 py-2 focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">难度</label>
                <select value={modal.form.difficulty} onChange={(e) => setModal({ ...modal, form: { ...modal.form, difficulty: e.target.value as QuestionForm["difficulty"] } })} className="w-full rounded-2xl border-2 border-slate-200 px-3 py-2">
                  {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <label className="block text-sm font-medium text-slate-600 mb-1">标准答案（选填，分数写法如 3/4，多问用顿号分隔）</label>
            <input
              value={modal.form.answer}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, answer: e.target.value } })}
              placeholder="如：3/4 或 40、100"
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2 mb-3 focus:border-sky-400 focus:outline-none"
            />
            <label className="block text-sm font-medium text-slate-600 mb-1">分步解析</label>
            <textarea
              value={modal.form.analysis}
              onChange={(e) => setModal({ ...modal, form: { ...modal.form, analysis: e.target.value } })}
              rows={4}
              className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 mb-4 focus:border-sky-400 focus:outline-none"
            />
            {formHint && <p className="text-rose-500 text-sm mb-3">{formHint}</p>}
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 bg-slate-100 rounded-2xl py-3">取消</button>
              <button onClick={save} className="flex-1 bg-sky-500 text-white rounded-2xl py-3 font-semibold">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}