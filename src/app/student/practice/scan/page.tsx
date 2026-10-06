"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Practice from "../Practice";

export default function ScanPracticePage() {
  const router = useRouter();
  const [fileId, setFileId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [photoKey, setPhotoKey] = useState<string>("");

  useEffect(() => {
    const id = sessionStorage.getItem("scanFileId");
    const pic = sessionStorage.getItem("scanPreview") || "";
    const key = sessionStorage.getItem("scanPhotoKey") || "";
    if (!id) {
      router.replace("/student");
      return;
    }
    setFileId(id);
    setPreview(pic);
    setPhotoKey(key);
  }, [router]);

  if (!fileId) return <p className="text-slate-400 text-center py-10">正在进入拍题练习…</p>;
  return <Practice imageFileId={fileId} imagePreview={preview} photoKey={photoKey} />;
}
