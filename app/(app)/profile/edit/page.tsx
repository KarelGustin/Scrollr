"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
      setHeightCm(user.heightCm ? String(user.heightCm) : "");
      setAvatarPreview(user.avatarUrl ?? null);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Upload to get a URL
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setAvatarPreview(data.url);
      } else {
        alert("Failed to upload image");
        setAvatarPreview(user?.avatarUrl ?? null);
      }
    } catch {
      alert("Failed to upload image");
      setAvatarPreview(user?.avatarUrl ?? null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (name !== (user?.name ?? "")) payload.name = name || null;
      if (bio !== (user?.bio ?? "")) payload.bio = bio || null;
      if (avatarPreview !== user?.avatarUrl) payload.avatarUrl = avatarPreview;
      if (heightCm !== String(user?.heightCm ?? "")) {
        payload.heightCm = heightCm ? parseInt(heightCm) : null;
      }

      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        <div className="flex items-center justify-between px-5 py-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="text-sm text-accent font-medium">
            Cancel
          </button>
          <h1 className="text-sm font-display font-bold text-text">Edit Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving || uploadingAvatar}
            className="text-sm text-accent font-semibold disabled:opacity-50"
          >
            {saved ? "Saved" : saving ? "..." : "Done"}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        {/* Avatar with upload */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative w-24 h-24 rounded-full bg-surface border-2 border-border flex items-center justify-center overflow-hidden group"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted">
                {(user?.name ?? "U").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </div>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="text-xs text-accent font-medium"
          >
            {uploadingAvatar ? "Uploading..." : "Change Photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
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
          <label className="text-xs text-muted block mb-1.5">Height (cm)</label>
          <input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="175"
            min={120}
            max={250}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50 transition-colors"
          />
          <p className="text-xs text-muted mt-1">Helps shoppers find their fit</p>
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
