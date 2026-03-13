"use client";

import { useState, useEffect } from "react";

interface AdminMessage {
  id: string;
  title: string;
  body: string;
}

export function MessagePopup() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [current, setCurrent] = useState<AdminMessage | null>(null);

  useEffect(() => {
    fetch("/api/user/messages")
      .then((res) => res.ok ? res.json() : [])
      .then((data: AdminMessage[]) => {
        if (data.length > 0) {
          setMessages(data);
          setCurrent(data[0]);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = async () => {
    if (!current) return;

    await fetch("/api/user/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: current.id }),
    }).catch(() => {});

    const remaining = messages.filter((m) => m.id !== current.id);
    setMessages(remaining);
    setCurrent(remaining[0] || null);
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-base font-display font-bold text-text mb-2">
          {current.title}
        </h3>
        <p className="text-sm text-muted mb-5 leading-relaxed">
          {current.body}
        </p>
        <button
          onClick={dismiss}
          className="w-full py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
