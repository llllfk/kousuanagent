"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function PracticePage({ id }: { id: number }) {
  const router = useRouter();
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
  const [initError, setInitError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const qRes = await fetch(`/api/questions/${id}`);
        const qData = await qRes.json();
        if (qData.error) throw new Error(qData.error);
        setQuestion(qData.data);

        const cRes = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: id }),
        });
        const cData = await cRes.json();
        if (cData.error) throw new Error(cData.error);
        convRef.current = cData.conversationId;
        setConversationId(cData.conversationId);
        // 开场白：让 AI 引导老师介绍题目并引导思考
        await send({
          type: "message",
          link: cData.conversationId,
          content: "你好！请先帮我看清这道题，然后一步步引导我思考怎么解答。",
          appendUser: false,
        });
      } catch (e: any) {
        setInitError(e?.message || "加载失败，请检查题目是否存在。");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

    if (!content || !convId || busy || solved) return;
    setBusy(true);

    const userMsg: Msg = { id: `u${Date.now()}`, role: "user", content };
    const botMsgId = `b${Date.now()}`;
    if (appendUser) {
      setMessages((m) => [...m, userMsg]);
    }
    setMessages((m) => [...m, { id: botMsgId, role: "bot", content: "" }]);
    setJudgeBanner(null);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: id, conversationId: convId, type, content }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const appendToken = (text: string) => {
        setMessages((m) => m.map((msg) => (msg.id === botMsgId ? { ...msg, content: msg.content + text } : msg)));
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
            const meta = JSON.parse(dataLine);
            setRoundCount(meta.roundCount);
            if (meta.type === "submit") {
              handleJudge(meta);
            }
          } else if (eventLine === "token") {
            const d = JSON.parse(dataLine);
            appendToken(d.text || "");
          } else if (eventLine === "error") {
            const d = JSON.parse(dataLine);
            appendToken(`（${d.text}）`);
          }
        }
      }
    } catch (e: any) {
      setMessages((m) => m.map((msg) => (msg.id === botMsgId ? { ...msg, content: msg.content || "（网络异常，请重试）" } : msg)));
    } finally {
      setBusy(false);
    }
  }

  function handleJudge(meta: any) {
    if (meta.solved) {
      setSolved(true);
      setJudgeBanner({ text: "你真棒！答案正确！", kind: "success" });
    } else if (meta.partCorrect) {
      setJudgeBanner({ text: "其中一部分对了，再想想另一部分～", kind: "part" });
    } else {
      setJudgeBanner({ text: "这个答案不对哦，别急，看看引导老师怎么说～", kind: "error" });
    }
  }

  function submitAnswer() {
    send({ type: "submit", content: input.trim() });
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* 题目卡片 */}
      <div className="bg-gradient-to-r from-sky-100 to-indigo-100 rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs rounded-full px-3 py-1 bg-white text-indigo-600 font-medium">{question?.question_type || ""}</span>
          <span className="text-xs rounded-full px-3 py-1 bg-white text-amber-600 font-medium">{question?.difficulty || ""}</span>
          {roundCount > 0 && <span className="text-xs text-slate-500">引导轮次：{roundCount}</span>}
        </div>
        <p className="text-lg leading-relaxed text-slate-800 font-medium">{question?.stem || "加载中…"}</p>
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
                m.role === "user" ? "bg-sky-500 text-white rounded-br-md" : "bg-slate-100 text-slate-800 rounded-bl-md"
              }`}
            >
              {m.content || (m.role === "bot" ? "▍" : "")}
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
              send();
            }
          }}
          rows={1}
          placeholder="和引导老师聊聊思路…"
          className="flex-1 resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-sky-400 focus:outline-none bg-slate-50"
        />
        <button
          onClick={submitAnswer}
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
    </div>
  );
}