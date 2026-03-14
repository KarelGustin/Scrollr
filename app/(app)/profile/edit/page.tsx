"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, bio: bio || undefined }),
      });
      if (res.ok) {
        await refreshUser();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={() => router.back()} className="text-sm text-accent font-medium">
            Cancel
          </button>
          <h1 className="text-sm font-display font-bold text-text">Edit Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm text-accent font-semibold disabled:opacity-50"
          >
            {saved ? "Saved" : saving ? "..." : "Done"}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted">
                {(user?.name ?? "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people about yourself..."
            maxLength={160}
            rows={3}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text resize-none focus:outline-none focus:border-accent/50 transition-colors"
          />
          <p className="text-xs text-muted mt-1 text-right">{bio.length}/160</p>
        </div>

        <div>
          <label className="text-xs text-muted block mb-1.5">Username</label>
          <div className="flex items-center bg-surface border border-border rounded-xl px-4 py-2.5">
            <span className="text-sm text-muted mr-1">@</span>
            <span className="text-sm text-text">{user?.username}</span>
          </div>
          <p className="text-xs text-muted mt-1">Username can&apos;t be changed</p>
        </div>
      </div>
    </div>
  );
}
