"use client";

import { useEffect, useState } from "react";

interface Video {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  user: { name: string | null; username: string | null };
}

interface Merchant {
  id: string;
  storeName: string | null;
}

interface Suggestion {
  productId: string;
  title: string;
  score: number;
}

export default function ContentSeedingPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    // Fetch all published videos (including those without products) and merchants
    Promise.all([
      fetch("/api/admin/videos?limit=100").then((r) => r.json()),
      fetch("/api/admin/merchants").then((r) => r.json()),
    ]).then(([videoData, merchantData]) => {
      setVideos(videoData.videos ?? []);
      setMerchants(merchantData.merchants ?? []);
    });
  }, []);

  const handleSuggest = async () => {
    if (!selectedVideo || !selectedMerchant) return;
    setLoading(true);
    setSuggestions([]);
    setSelected(new Set());
    setResult("");

    try {
      const res = await fetch("/api/admin/content-seeding/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: selectedVideo, merchantId: selectedMerchant }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      // Auto-select products with score > 0.1
      const autoSelect = new Set<string>((data.suggestions ?? [])
        .filter((s: Suggestion) => s.score > 0.1)
        .map((s: Suggestion) => s.productId));
      setSelected(autoSelect);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleApply = async () => {
    if (selected.size === 0 || !selectedVideo) return;
    setApplying(true);
    setResult("");

    try {
      const res = await fetch("/api/admin/content-seeding/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: selectedVideo,
          merchantProductIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      setResult(`Tagged ${data.created} products on this video`);
    } catch {
      setResult("Failed to apply tags");
    }
    setApplying(false);
  };

  const toggleProduct = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Content Seeding</h1>
        <p className="text-sm text-muted mt-1">Match merchant products to videos using keyword matching</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: video + merchant selection */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1.5">Select Video</label>
              <select
                value={selectedVideo}
                onChange={(e) => setSelectedVideo(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
              >
                <option value="">Choose a video...</option>
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title ?? `Untitled`} — @{v.user?.username ?? "unknown"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1.5">Select Merchant</label>
              <select
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent/50"
              >
                <option value="">Choose a merchant...</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.storeName ?? m.id}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSuggest}
              disabled={loading || !selectedVideo || !selectedMerchant}
              className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors touch-target"
            >
              {loading ? "Analyzing..." : "Suggest Products"}
            </button>
          </div>
        </div>

        {/* Right: suggestions */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-display font-bold text-text mb-4">Product Suggestions</h3>

          {suggestions.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">
              Select a video and merchant, then click &quot;Suggest Products&quot;
            </p>
          ) : (
            <div className="space-y-2">
              {suggestions.map((s) => (
                <label
                  key={s.productId}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.productId)}
                    onChange={() => toggleProduct(s.productId)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text truncate">{s.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${Math.round(s.score * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted w-8 text-right">{Math.round(s.score * 100)}%</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mt-4 space-y-2">
              <button
                onClick={handleApply}
                disabled={applying || selected.size === 0}
                className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors touch-target"
              >
                {applying ? "Applying..." : `Apply Tags (${selected.size} selected)`}
              </button>
              {result && (
                <p className="text-sm text-center text-success">{result}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
