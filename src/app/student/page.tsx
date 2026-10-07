"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DIFFICULTIES } from "@/lib/rounds";
import { RichMathText } from "@/components/RichMathText";

interface Question {
  id: number;
  stem: string;
  question_type: string;
  difficulty: string;
}

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
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);

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

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setScanning(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/questions/scan", { method: "POST", body: form });
      const json = (await res.json()) as { error?: string; data?: { fileId: string; photoKey?: string } };
      if (!res.ok || json.error || !json.data?.fileId) {
        throw new Error(json.error || "上传失败，请重试");
      }
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("读取图片失败"));
        reader.readAsDataURL(file);
      });
      sessionStorage.setItem("scanFileId", json.data.fileId);
      sessionStorage.setItem("scanPhotoKey", json.data.photoKey || "");
      sessionStorage.setItem("scanPreview", preview);
      router.push("/student/practice/scan");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "识别失败，请重试");
    } finally {
      setScanning(false);
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-1">选择题目开始练习</h1>
          <p className="text-slate-500">点击题目，AI 引导老师会陪着你一步步思考，不会直接给答案哦。</p>
        </div>
        <div>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onPickImage(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={scanning}
            onClick={() => cameraRef.current?.click()}
            className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white rounded-2xl px-5 py-3 font-semibold"
          >
            {scanning ? "上传中…" : "拍题目"}
          </button>
        </div>
      </div>

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
            {Array.from(new Set([type, ...questions.map((q) => q.question_type)].filter(Boolean))).map((t) => (
              <button
                key={t}
                onClick={() => setType(type === t ? "" : t)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${type === t ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {t}
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
              <span className="text-xs rounded-full px-3 py-1 bg-indigo-100 text-indigo-700">{q.question_type}</span>
              <span className={`text-xs rounded-full px-3 py-1 ${diffColor[q.difficulty] || "bg-slate-100 text-slate-600"}`}>{q.difficulty}</span>
            </div>
            <p className="text-slate-700 text-lg leading-relaxed line-clamp-3">
              <RichMathText text={q.stem} />
            </p>
            <div className="mt-3 text-sky-500 text-sm font-medium">开始练习 →</div>
          </button>
        ))}
      </div>
    </div>
  );
}