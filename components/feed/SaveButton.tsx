"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SaveButton({ videoId }: { videoId: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving || saved) return;

    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent("/discover")}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleSave();
      }}
      disabled={saving}
      className="flex items-center justify-center w-10 h-10 bg-bg/60 backdrop-blur-md rounded-full border border-white/10 transition-transform active:scale-95 disabled:opacity-70"
      title={saved ? "Saved" : "Save"}
      aria-label={saved ? "Saved" : "Save video"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={saved ? "text-accent" : "text-white"}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
