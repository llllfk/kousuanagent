"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Detail {
  id: number;
  question_id: number;
  stem: string;
  question_type: string;
  difficulty: string;
  student_answer: string;
  is_correct: boolean;
  guide_rounds: number;
  attempt_number: number;
  practice_time: string;
}

interface Summary {
  question_id: number;
  stem: string;
  question_type: string;
  difficulty: string;
  attempts: number;
  practice_time?: string;
  everCorrect: boolean;
}

export default function StudentRecords() {
  const router = useRouter();
  const [data, setData] = useState<{ details: Detail[]; questionSummary: Summary[]; stats: any } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/records");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json.data);
      } catch (e: any) {
        setError(e?.message || "加载失败");
      }
    })();
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-slate-400 text-center py-10">加载中…</p>;

  const fmt = (t: string) =>
    t ? new Date(t).toLocaleString("zh-CN", { hour12: false }) : "-";

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-1">我的练习记录</h1>
      <p className="text-slate-500 mb-6">看看做过的题和你的进步吧。</p>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "做过题目", value: data.stats.answeredQuestions, icon: "📚" },
          { label: "练习次数", value: data.stats.totalAttempts, icon: "✏️" },
          { label: "答对次数", value: data.stats.correctAttempts, icon: "✅" },
          { label: "正确率", value: `${data.stats.correctRate}%`, icon: "🎯" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-3xl shadow p-4 text-center">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 逐题汇总 */}
      <h2 className="text-xl font-semibold text-slate-700 mb-3">按题目汇总</h2>
      {data.questionSummary.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-white rounded-3xl shadow">
          你还没有练习记录，快去
          <button className="text-sky-500 font-bold mx-1" onClick={() => router.push("/student")}>选一道题</button>
          开始吧！
        </div>
      )}
      <div className="space-y-3 mb-8">
        {data.questionSummary.map((s) => (
          <div key={s.question_id} className="bg-white rounded-3xl shadow p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-slate-700 line-clamp-2">{s.stem}</p>
              <div className="text-sm text-slate-400 mt-1">
                练习 {s.attempts} 次 · {s.difficulty}
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${s.everCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
              {s.everCorrect ? "已做对" : "未做对"}
            </span>
          </div>
        ))}
      </div>

      {/* 明细 */}
      <h2 className="text-xl font-semibold text-slate-700 mb-3">每次作答明细</h2>
      {data.details.length === 0 ? (
        <p className="text-slate-400">暂无明细</p>
      ) : (
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">题目</th>
                  <th className="px-4 py-3">我的答案</th>
                  <th className="px-4 py-3">结果</th>
                  <th className="px-4 py-3">第几次</th>
                  <th className="px-4 py-3">引导轮次</th>
                  <th className="px-4 py-3">时间</th>
                </tr>
              </thead>
              <tbody>
                {data.details.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 max-w-[200px] line-clamp-2">{d.stem}</td>
                    <td className="px-4 py-3">{d.student_answer}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 ${d.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                        {d.is_correct ? "对" : "错"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{d.attempt_number}</td>
                    <td className="px-4 py-3">{d.guide_rounds}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">{fmt(d.practice_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}