"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QUESTION_TYPES, DIFFICULTIES } from "@/lib/rounds";

interface Question {
  id: number;
  stem: string;
  question_type: string;
  difficulty: string;
}

const typeLabels: Record<string, string> = {
  求一个数的几分之几: "求几分之几",
  连续求: "连续求",
  比一个数多或少几分之几: "多/少几分之几",
  两问复合: "两问复合",
};

const diffColor: Record<string, string> = {
  简单: "bg-emerald-100 text-emerald-700",
  中等: "bg-amber-100 text-amber-700",
  较难: "bg-rose-100 text-rose-700",
};

export default function StudentQuestionList() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (difficulty) params.set("difficulty", difficulty);
      if (keyword) params.set("keyword", keyword);
      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuestions(data.data || []);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [type, difficulty, keyword]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-1">选择题目开始练习</h1>
      <p className="text-slate-500 mb-6">点击题目，AI 引导老师会陪着你一步步思考，不会直接给答案哦。</p>

      {/* 筛选 */}
      <div className="bg-white rounded-3xl shadow p-4 mb-6">
        <div className="mb-3">
          <div className="text-sm text-slate-500 mb-2">按题型筛选</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setType("")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${type === "" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              全部
            </button>
            {QUESTION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(type === t ? "" : t)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${type === t ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {typeLabels[t] || t}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-sm text-slate-500 mb-2">按难度筛选</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDifficulty("")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${difficulty === "" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              全部
            </button>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(difficulty === d ? "" : d)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${difficulty === d ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索关键词（如：苹果、修路）"
          className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2 text-base focus:border-sky-400 focus:outline-none"
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading && <p className="text-slate-400 text-center py-10">加载中…</p>}

      {!loading && questions.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🔍</div>
          没有找到符合条件的题目
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => router.push(`/student/practice/${q.id}`)}
            className="bg-white rounded-3xl shadow p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs rounded-full px-3 py-1 bg-indigo-100 text-indigo-700">{typeLabels[q.question_type] || q.question_type}</span>
              <span className={`text-xs rounded-full px-3 py-1 ${diffColor[q.difficulty] || "bg-slate-100 text-slate-600"}`}>{q.difficulty}</span>
            </div>
            <p className="text-slate-700 text-lg leading-relaxed line-clamp-3">{q.stem}</p>
            <div className="mt-3 text-sky-500 text-sm font-medium">开始练习 →</div>
          </button>
        ))}
      </div>
    </div>
  );
}