"use client";

import { useCallback, useEffect, useState } from "react";
import { QUESTION_TYPES, DIFFICULTIES } from "@/lib/rounds";

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
  question_type: (typeof QUESTION_TYPES)[number];
  difficulty: (typeof DIFFICULTIES)[number];
};

const emptyForm: QuestionForm = { stem: "", answer: "", analysis: "", question_type: QUESTION_TYPES[0], difficulty: DIFFICULTIES[0] };

export default function TeacherQuestions() {
  const [list, setList] = useState<Question[]>([]);
  const [error, setError] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [modal, setModal] = useState<null | { form: typeof emptyForm; id?: number }>(null);
  const [generating, setGenerating] = useState(false);

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

  async function aiGenerate() {
    if (!modal || !modal.form.stem.trim()) {
      setError("请先输入题干，再点击 AI 生成");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stem: modal.form.stem,
          questionType: modal.form.question_type,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setModal((m) => (m ? { ...m, form: { ...m.form, answer: json.data.answer || m.form.answer, analysis: json.data.analysis || m.form.analysis } } : m));
    } catch (e: any) {
      setError(e?.message || "AI 生成失败");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!modal) return;
    setError("");
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
    const json = await res.json();
    if (json.error) setError(json.error);
    else {
      setModal(null);
      load();
    }
  }

  async function remove(q: Question) {
    if (!confirm(`确定删除这道题吗？相关练习记录也会删除。`)) return;
    const res = await fetch(`/api/teacher/questions/${q.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.error) setError(json.error);
    else load();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-1">题库管理</h1>
      <p className="text-slate-500 mb-6">共 {list.length} 道题。可新增题目，AI 会自动生成答案与解析，供你修改后保存。</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-3xl shadow p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex flex-wrap gap-2 flex-1">
          <button onClick={() => setType("")} className={`px-4 py-2 rounded-full text-sm font-medium ${type === "" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}>全部</button>
          {QUESTION_TYPES.map((t) => (
            <button key={t} onClick={() => setType(type === t ? "" : t)} className={`px-4 py-2 rounded-full text-sm font-medium ${type === t ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}>{t}</button>
          ))}
        </div>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-2xl border-2 border-slate-200 px-3 py-2">
          <option value="">全部难度</option>
          {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button
          onClick={() => setModal({ form: { ...emptyForm } })}
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
                <button onClick={() => setModal({ id: q.id, form: { stem: q.stem, answer: q.answer, analysis: q.analysis, question_type: q.question_type as QuestionForm["question_type"], difficulty: q.difficulty as QuestionForm["difficulty"] } })} className="text-sky-500 text-sm">编辑</button>
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
                <select value={modal.form.question_type} onChange={(e) => setModal({ ...modal, form: { ...modal.form, question_type: e.target.value as QuestionForm["question_type"] } })} className="w-full rounded-2xl border-2 border-slate-200 px-3 py-2">
                  {QUESTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">难度</label>
                <select value={modal.form.difficulty} onChange={(e) => setModal({ ...modal, form: { ...modal.form, difficulty: e.target.value as QuestionForm["difficulty"] } })} className="w-full rounded-2xl border-2 border-slate-200 px-3 py-2">
                  {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-600">标准答案（分数写法如 3/4，多问用顿号分隔）</label>
              <button onClick={aiGenerate} disabled={generating} className="text-sm bg-indigo-100 text-indigo-600 rounded-xl px-3 py-1 hover:bg-indigo-200">
                {generating ? "生成中…" : "✨ AI 生成答案与解析"}
              </button>
            </div>
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
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 bg-slate-100 rounded-2xl py-3">取消</button>
              <button onClick={save} disabled={!modal.form.stem.trim()} className="flex-1 bg-sky-500 text-white rounded-2xl py-3 font-semibold">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}