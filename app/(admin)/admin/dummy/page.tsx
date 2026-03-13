"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface CreatedAccount {
  id: string;
  email: string;
  username: string;
  role: string;
}

export default function AdminDummyPage() {
  const [count, setCount] = useState(5);
  const [role, setRole] = useState<"USER" | "CREATOR">("CREATOR");
  const [withContent, setWithContent] = useState(true);
  const [results, setResults] = useState<CreatedAccount[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/dummy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, role, withContent }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ created: CreatedAccount[]; count: number }>;
    },
    onSuccess: (data) => {
      setResults((prev) => [...data.created, ...prev]);
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text">Dummy Data</h1>
        <p className="text-sm text-muted mt-1">Create test accounts and content</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 max-w-md space-y-5">
        <div>
          <label className="text-xs text-muted block mb-1.5">Number of accounts</label>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
          />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Role</label>
          <div className="flex gap-2">
            {(["USER", "CREATOR"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  role === r
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border bg-surface text-muted hover:text-text"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {role === "CREATOR" && (
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                withContent ? "bg-accent border-accent" : "border-border"
              }`}
              onClick={() => setWithContent(!withContent)}
            >
              {withContent && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </div>
            <span className="text-sm text-text">Include dummy products</span>
          </label>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
        >
          {mutation.isPending ? `Creating ${count} accounts...` : `Create ${count} Accounts`}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-text">Created Accounts ({results.length})</h2>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {results.map((account) => (
              <div key={account.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-text font-medium">@{account.username}</p>
                  <p className="text-xs text-muted">{account.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  account.role === "CREATOR" ? "bg-accent/10 text-accent" : "bg-surface text-muted"
                }`}>
                  {account.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
