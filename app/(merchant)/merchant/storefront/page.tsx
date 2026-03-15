"use client";

import { useEffect, useState } from "react";

export default function StorefrontSettingsPage() {
  const [theme, setTheme] = useState("light");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/storefront")
      .then((r) => r.json())
      .then((data) => {
        if (data.merchant) {
          setTheme(data.merchant.storeTheme || "light");
          setDescription(data.merchant.storeDescription || "");
          setSlug(data.merchant.slug || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/merchant/storefront", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeTheme: theme, storeDescription: description }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-[#1a1a1a] mb-6">Storefront Settings</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-[#f5f3f0] rounded-xl" />
          <div className="h-32 bg-[#f5f3f0] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-[#1a1a1a] mb-6">Storefront Settings</h1>

      {/* Storefront URL */}
      {slug && (
        <div className="bg-white border border-[#f0f0f0] rounded-xl p-5 mb-4">
          <p className="text-xs text-[#999] mb-1">Your storefront URL</p>
          <p className="text-sm font-semibold text-[#1a1a1a]">{appUrl}/store/{slug}</p>
        </div>
      )}

      {/* Theme Toggle */}
      <div className="bg-white border border-[#f0f0f0] rounded-xl p-5 mb-4">
        <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">Theme</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              theme === "light" ? "border-[#1a1a1a] bg-[#FAFAF8]" : "border-[#f0f0f0] hover:border-[#ddd]"
            }`}
          >
            <div className="w-full h-16 bg-[#FAFAF8] border border-[#f0f0f0] rounded-md mb-2" />
            <p className="text-sm font-medium text-[#1a1a1a]">Light</p>
            <p className="text-xs text-[#999]">Warm white background</p>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              theme === "dark" ? "border-[#1a1a1a] bg-[#FAFAF8]" : "border-[#f0f0f0] hover:border-[#ddd]"
            }`}
          >
            <div className="w-full h-16 bg-[#111] rounded-md mb-2" />
            <p className="text-sm font-medium text-[#1a1a1a]">Dark</p>
            <p className="text-xs text-[#999]">Dark background</p>
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white border border-[#f0f0f0] rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">Store Description</h3>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell customers about your brand..."
          className="w-full h-24 px-3 py-2 text-sm border border-[#f0f0f0] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/20 focus:border-[#FF6B4A]"
          maxLength={200}
        />
        <p className="text-xs text-[#999] mt-1">{description.length}/200</p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
