"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [sent, setSent] = useState(false);

  // Search for users to send messages to
  const { data: searchResults } = useQuery<{ users: { id: string; email: string; name: string | null; username: string | null }[] }>({
    queryKey: ["admin-user-search", userSearch],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}&pageSize=5`);
      if (!res.ok) return { users: [] };
      return res.json();
    },
    enabled: userSearch.length >= 2,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, body }),
      });
      if (!res.ok) throw new Error("Failed to send");
    },
    onSuccess: () => {
      setSent(true);
      setTitle("");
      setBody("");
      setUserId("");
      setUserSearch("");
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      setTimeout(() => setSent(false), 3000);
    },
  });

  // Sent messages list
  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/messages");
      if (!res.ok) return [];
      return res.json() as Promise<{ id: string; userId: string; title: string; body: string; read: boolean; createdAt: string }[]>;
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Messages</h1>
        <p className="text-sm text-muted mt-1">Send popup messages to users</p>
      </div>

      {/* Send form */}
      <div className="bg-card rounded-xl border border-border p-5 max-w-lg space-y-4 mb-8">
        <div>
          <label className="text-xs text-muted block mb-1.5">Recipient</label>
          <input
            type="text"
            value={userSearch}
            onChange={(e) => { setUserSearch(e.target.value); setUserId(""); }}
            placeholder="Search by email or name..."
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          />
          {searchResults?.users && searchResults.users.length > 0 && !userId && (
            <div className="mt-1 bg-card border border-border rounded-xl overflow-hidden">
              {searchResults.users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setUserId(u.id); setUserSearch(u.name || u.email); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface transition-colors"
                >
                  <span className="text-text">{u.name || u.username}</span>
                  <span className="text-muted ml-2">{u.email}</span>
                </button>
              ))}
            </div>
          )}
          {userId && (
            <p className="text-xs text-success mt-1">User selected</p>
          )}
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Message title"
            maxLength={100}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message content..."
            rows={3}
            maxLength={500}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text resize-none focus:outline-none focus:border-accent/50"
          />
        </div>

        <button
          onClick={() => sendMutation.mutate()}
          disabled={!userId || !title || !body || sendMutation.isPending}
          className="w-full py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
        >
          {sent ? "Sent!" : sendMutation.isPending ? "Sending..." : "Send Message"}
        </button>
      </div>

      {/* Sent messages */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-text">Sent Messages</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="text-accent" />
          </div>
        ) : !messages?.length ? (
          <p className="text-sm text-muted text-center py-8">No messages sent yet</p>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((msg) => (
              <div key={msg.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-text">{msg.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      msg.read ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {msg.read ? "Read" : "Unread"}
                    </span>
                    <span className="text-xs text-muted">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-xs text-muted line-clamp-1">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
