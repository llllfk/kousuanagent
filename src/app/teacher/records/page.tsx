"use client";

import { useEffect, useState } from "react";
import { PHOTO_QUESTION_TYPE, isPhotoQuestion } from "@/lib/rounds";
import { PhotoPreview } from "@/components/PhotoPreview";
import { RichMathText } from "@/components/RichMathText";

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
  submitted?: boolean;
}

interface Detail {
  id: number;
  student_name: string;
  stem: string;
  question_type: string;
  student_answer: string;
  photo_key?: string;
  is_correct: boolean;
  judged?: boolean;
  submitted?: boolean;
  attempt_number: number;
  guide_rounds: number;
  practice_time: string;
}

interface StudentOpt {
  id: number;
  name: string;
}

export default function TeacherRecords() {
  const [rows, setRows] = useState<Row[]>([]);
  const [details, setDetails] = useState<Detail[]>([]);
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
        else {
          setRows(j.data || []);
          setDetails(j.details || []);
        }
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
                  const status = !r.submitted
                    ? { text: "已对话", cls: "bg-sky-100 text-sky-700" }
                    : photo || r.judged === false
                      ? { text: "已提交", cls: "bg-sky-100 text-sky-700" }
                      : {
                          text: `${r.correctAttempts}/${r.attempts}`,
                          cls: r.correctAttempts > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600",
                        };
                  return (
                  <tr key={`${r.student_id}-${r.question_id}`} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{r.student_name}</td>
                    <td className="px-4 py-3 max-w-[240px]">
                      {photo ? "拍题目" : (
                        <span className="line-clamp-2">
                          <RichMathText text={r.stem} />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{photo ? "拍题目" : r.question_type}</td>
                    <td className="px-4 py-3">
                      {r.lastAnswer ? <RichMathText text={r.lastAnswer} /> : "-"}
                    </td>
                    <td className="px-4 py-3">{r.attempts}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 ${status.cls}`}>
                        {status.text}
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

      <h2 className="text-xl font-semibold text-slate-700 mt-8 mb-3">每次作答明细</h2>
      {details.length === 0 ? (
        <p className="text-slate-400">暂无明细</p>
      ) : (
        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">学生</th>
                  <th className="px-4 py-3">题目</th>
                  <th className="px-4 py-3">题目图片</th>
                  <th className="px-4 py-3">答案</th>
                  <th className="px-4 py-3">结果</th>
                  <th className="px-4 py-3">第几次</th>
                  <th className="px-4 py-3">时间</th>
                </tr>
              </thead>
              <tbody>
                {details.map((d) => {
                  const photo = isPhotoQuestion(d.stem, d.question_type);
                  const status = !d.submitted
                    ? { text: "已对话", cls: "bg-sky-100 text-sky-700" }
                    : photo || d.judged === false
                      ? { text: "已提交", cls: "bg-sky-100 text-sky-700" }
                      : d.is_correct
                        ? { text: "对", cls: "bg-emerald-100 text-emerald-700" }
                        : { text: "错", cls: "bg-rose-100 text-rose-600" };
                  return (
                    <tr key={d.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3 font-medium">{d.student_name}</td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {photo ? "拍题目" : <RichMathText text={d.stem} />}
                      </td>
                      <td className="px-4 py-3">
                        {d.photo_key ? <PhotoPreview photoKey={d.photo_key} /> : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        {d.student_answer ? <RichMathText text={d.student_answer} /> : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 ${status.cls}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">{d.attempt_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {d.practice_time ? new Date(d.practice_time).toLocaleString("zh-CN", { hour12: false }) : "-"}
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