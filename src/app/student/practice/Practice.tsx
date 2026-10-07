"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Msg {
  id: string;
  role: "user" | "bot";
  content: string;
}

interface Question {
  id: number;
  stem: string;
  question_type: string;
  difficulty: string;
}

export default function PracticePage({
  id,
  imageFileId,
  imagePreview,
  photoKey,
}: {
  id?: number;
  imageFileId?: string;
  imagePreview?: string;
  photoKey?: string;
}) {
  const router = useRouter();
  const photoMode = Boolean(imageFileId);
  const questionId = id ?? 0;
  const [question, setQuestion] = useState<Question | null>(null);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [roundCount, setRoundCount] = useState(0);
  const [solved, setSolved] = useState(false);
  const [judgeBanner, setJudgeBanner] = useState<{ text: string; kind: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const convRef = useRef("");
  const busyRef = useRef(false);
  const [initError, setInitError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState("");

  useEffect(() => {
    let cancelled = false;
    busyRef.current = false;
    setMessages([]);
    setConversationId("");
    convRef.current = "";
    setInitError("");
    setSolved(false);
    setRoundCount(0);
    setJudgeBanner(null);

    (async () => {
      try {
        if (!photoMode) {
          const qRes = await fetch(`/api/questions/${questionId}`);
          const qData = await qRes.json();
          if (cancelled) return;
          if (qData.error) throw new Error(qData.error);
          setQuestion(qData.data);
        }

        const cRes = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            photoMode ? { photo: true, photoKey: photoKey || "" } : { questionId }
          ),
        });
        const cData = await cRes.json();
        if (cancelled) return;
        if (cData.error) throw new Error(cData.error);
        convRef.current = cData.conversationId;
        setConversationId(cData.conversationId);
        await send({
          type: "opening",
          link: cData.conversationId,
          content: "",
          appendUser: false,
        });
      } catch (e: unknown) {
        if (cancelled) return;
        setInitError(e instanceof Error ? e.message : "加载失败，请检查题目是否存在。");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, imageFileId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, judgeBanner]);

  async function send(opts?: {
    type?: string;
    link?: string;
    content?: string;
    appendUser?: boolean;
  }) {
    const type = opts?.type || "message";
    const content = opts?.content ?? input.trim();
    const convId = opts?.link || convRef.current;
    const appendUser = opts?.appendUser !== false;

    if (!convId || busyRef.current || solved) return;
    if (type !== "opening" && !content) return;
    busyRef.current = true;
    setBusy(true);

    const stamp = Date.now();
    const userMsg: Msg = { id: `u${stamp}`, role: "user", content };
    const botMsgId = `b${stamp}`;
    setMessages((m) => [
      ...m,
      ...(appendUser ? [userMsg] : []),
      { id: botMsgId, role: "bot", content: "" },
    ]);
    setJudgeBanner(null);
    if (appendUser) setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: photoMode ? undefined : questionId,
          conversationId: convId,
          type,
          content,
          photo: photoMode,
          fileId: photoMode && type === "opening" ? imageFileId : undefined,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const appendTo = (id: string, text: string) => {
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, content: msg.content + text } : msg)));
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const eventLine = part.split("\n").find((l) => l.startsWith("event:"))?.slice(6).trim();
          const dataLine = part.split("\n").find((l) => l.startsWith("data:"))?.slice(5).trim();
          if (!dataLine) continue;
          if (eventLine === "meta") {
            const meta = JSON.parse(dataLine) as { roundCount?: number };
            if (typeof meta.roundCount === "number") setRoundCount(meta.roundCount);
          } else if (eventLine === "token") {
            const d = JSON.parse(dataLine) as { text?: string };
            appendTo(botMsgId, d.text || "");
          } else if (eventLine === "error") {
            const d = JSON.parse(dataLine) as { text?: string };
            appendTo(botMsgId, `（${d.text || "出错了"}）`);
          }
        }
      }
    } catch {
      setMessages((m) =>
        m.map((msg) => (msg.id === botMsgId ? { ...msg, content: msg.content || "（网络异常，请重试）" } : msg))
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function submitRecord() {
    const answer = pendingAnswer.trim();
    setConfirmOpen(false);
    if (!answer || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: photoMode ? undefined : questionId,
          photo: photoMode,
          conversationId: convRef.current,
          studentAnswer: answer,
          photoKey: photoMode ? photoKey || "" : "",
        }),
      });
      const data = (await res.json()) as { error?: string; status?: string };
      if (!res.ok || data.error) throw new Error(data.error || "提交失败");
      setMessages((m) => [
        ...m,
        { id: `u${Date.now()}`, role: "user", content: `已提交答案：${answer}` },
      ]);
      setInput("");
      setJudgeBanner({ text: "答案已提交，已记入练习记录。", kind: "success" });
    } catch (e: unknown) {
      setJudgeBanner({
        text: e instanceof Error ? e.message : "提交失败",
        kind: "error",
      });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function askSubmitConfirm() {
    const answer = input.trim();
    if (!answer || busy || solved) return;
    setPendingAnswer(answer);
    setConfirmOpen(true);
  }

  function confirmSubmit() {
    void submitRecord();
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* 题目卡片 */}
      <div className="bg-gradient-to-r from-sky-100 to-indigo-100 rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs rounded-full px-3 py-1 bg-white text-indigo-600 font-medium">
            {photoMode ? "拍题目" : question?.question_type || ""}
          </span>
          {!photoMode && (
            <span className="text-xs rounded-full px-3 py-1 bg-white text-amber-600 font-medium">{question?.difficulty || ""}</span>
          )}
          {roundCount > 0 && <span className="text-xs text-slate-500">引导轮次：{roundCount}</span>}
        </div>
        {photoMode && imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePreview} alt="拍摄的题目" className="mt-2 max-h-56 rounded-2xl object-contain bg-white" />
        ) : (
          <p className="text-lg leading-relaxed text-slate-800 font-medium">{question?.stem || "加载中…"}</p>
        )}
        <button onClick={() => router.push("/student")} className="mt-3 text-sky-600 text-sm font-medium">
          ← 返回题目列表
        </button>
      </div>

      {judgeBanner && (
        <div
          className={`mb-3 rounded-2xl px-4 py-3 text-lg font-semibold ${
            judgeBanner.kind === "success"
              ? "bg-emerald-100 text-emerald-700"
              : judgeBanner.kind === "part"
              ? "bg-amber-100 text-amber-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {judgeBanner.text}
        </div>
      )}

      {solved && (
        <div className="mb-3 rounded-2xl px-4 py-3 bg-emerald-50 text-emerald-700">
          已答对！可以
          <button className="font-bold underline mx-1" onClick={() => router.push("/student")}>换一道题</button>
          或查看
          <button className="font-bold underline mx-1" onClick={() => router.push("/student/records")}>练习记录</button>。
        </div>
      )}

      {initError && <div className="text-red-500 mb-3">{initError}</div>}

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto bg-white rounded-3xl shadow p-4 space-y-3 min-h-0">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-lg whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-sky-500 text-white rounded-br-md"
                  : "bg-slate-100 text-slate-800 rounded-bl-md"
              }`}
            >
              {m.content ? (
                m.content
              ) : m.role === "bot" ? (
                <span className="text-slate-400">引导老师正在输入…</span>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div className="mt-3 bg-white rounded-3xl shadow p-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!busy && !solved && input.trim()) send();
            }
          }}
          rows={1}
          placeholder="和引导老师聊聊思路…"
          className="flex-1 resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-sky-400 focus:outline-none bg-slate-50"
        />
        <button
          onClick={askSubmitConfirm}
          disabled={busy || solved || !input.trim()}
          className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-2xl px-5 py-3 text-lg"
        >
          提交答案
        </button>
        <button
          onClick={() => send()}
          disabled={busy || solved || !input.trim()}
          className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold rounded-2xl px-5 py-3 text-lg"
        >
          {busy ? "…" : "发送"}
        </button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认提交答案？</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>提交后只记入练习记录，不会发给引导老师，也不再判断对错。</p>
                <p className="rounded-2xl bg-slate-100 px-4 py-3 text-base text-slate-800 break-words">
                  {pendingAnswer}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">再想想</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-amber-500 text-white hover:bg-amber-600"
              onClick={confirmSubmit}
            >
              确认提交
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}