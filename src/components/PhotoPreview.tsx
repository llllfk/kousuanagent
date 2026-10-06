"use client";

import { useEffect, useState } from "react";

export function PhotoPreview({
  photoKey,
  alt = "拍题目",
}: {
  photoKey: string;
  alt?: string;
}) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!photoKey) return;
    let objectUrl = "";
    const ctrl = new AbortController();
    setError("");
    setSrc("");
    (async () => {
      try {
        const res = await fetch(`/api/photos?key=${encodeURIComponent(photoKey)}`, {
          credentials: "include",
          signal: ctrl.signal,
        });
        const type = res.headers.get("content-type") || "";
        if (!res.ok || type.includes("application/json")) {
          const json = type.includes("application/json") ? await res.json() : null;
          throw new Error((json as { error?: string } | null)?.error || "图片加载失败");
        }
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch (e: unknown) {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "图片加载失败");
      }
    })();
    return () => {
      ctrl.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoKey]);

  if (!photoKey) return <span className="text-slate-300">-</span>;
  if (error) return <span className="text-slate-400 text-xs">{error}</span>;
  if (!src) return <span className="text-slate-400 text-xs">加载中…</span>;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-20 w-20 rounded-xl object-cover bg-slate-100 ring-1 ring-slate-200 hover:ring-sky-400" />
        <span className="mt-1 block text-xs text-sky-600">点击预览</span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain bg-white"
          />
        </div>
      )}
    </>
  );
}
