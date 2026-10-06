"use client";

import { useEffect, useState } from "react";
import { PHOTO_QUESTION_TYPE, isPhotoQuestion } from "@/lib/rounds";

interface Row {
  student_id: number;
  student_name: string;
  question_id: number;
  stem: string;
  question_type: string;
  difficulty: string;
  attempts: number;
  correctAttempts: number;
  guideRounds: number[];
  lastTime: string;
  lastAnswer: string;
  lastPhotoKey?: string;
  judged?: boolean;
}

interface StudentOpt {
  id: number;
  name: string;
}

export default function TeacherRecords() {
  const [rows, setRows] = useState<Row[]>([]);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [studentId, setStudentId] = useState("");
  const [qtype, setQtype] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/teacher/students")
      .then((r) => r.json())
      .then((j) => setStudents(j.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (studentId) params.set("studentId", studentId);
    if (qtype) params.set("questionType", qtype);
    fetch(`/api/teacher/records?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error);
        else setRows(j.data || []);
      })
      .catch(() => setError("加载失败"));
  }, [studentId, qtype]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-1">练习记录</h1>
      <p className="text-slate-500 mb-6">按学生和题型查看每位学生的做题明细。</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white rounded-3xl shadow p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="rounded-2xl border-2 border-slate-200 px-3 py-2">
          <option value="">全部学生</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={qtype} onChange={(e) => setQtype(e.target.value)} className="rounded-2xl border-2 border-slate-200 px-3 py-2">
          <option value="">全部题型</option>
          {Array.from(
            new Set(
              [qtype, ...rows.map((r) => (isPhotoQuestion(r.stem, r.question_type) ? PHOTO_QUESTION_TYPE : r.question_type))].filter(Boolean)
            )
          ).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-slate-400 self-center text-sm">共 {rows.length} 条（学生 × 题目）</span>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-14 text-slate-400 bg-white rounded-3xl shadow">暂无练习记录</div>
      ) : (
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">学生</th>
                  <th className="px-4 py-3">题目</th>
                  <th className="px-4 py-3">题型</th>
                  <th className="px-4 py-3">最近答案</th>
                  <th className="px-4 py-3">练习次数</th>
                  <th className="px-4 py-3">结果</th>
                  <th className="px-4 py-3">引导轮次</th>
                  <th className="px-4 py-3">最近时间</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const photo = isPhotoQuestion(r.stem, r.question_type);
                  const unjudged = photo || r.judged === false;
                  return (
                  <tr key={`${r.student_id}-${r.question_id}`} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{r.student_name}</td>
                    <td className="px-4 py-3 max-w-[240px]">
                      {r.lastPhotoKey ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/photos?key=${encodeURIComponent(r.lastPhotoKey)}`}
                          alt="拍题目"
                          className="h-16 w-16 rounded-xl object-cover bg-slate-100"
                        />
                      ) : photo ? (
                        "拍题目"
                      ) : (
                        <span className="line-clamp-2">{r.stem}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{photo ? "拍题目" : r.question_type}</td>
                    <td className="px-4 py-3">{r.lastAnswer || "-"}</td>
                    <td className="px-4 py-3">{r.attempts}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 ${
                        unjudged ? "bg-sky-100 text-sky-700" : r.correctAttempts > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                      }`}>
                        {unjudged ? "已提交" : `${r.correctAttempts}/${r.attempts}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.guideRounds.join("/")}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                      {new Date(r.lastTime).toLocaleString("zh-CN", { hour12: false })}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}