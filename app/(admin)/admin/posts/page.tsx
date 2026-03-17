"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Merchant {
  id: string;
  storeName: string | null;
  shopifyDomain: string;
  userId: string;
}

interface Video {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  status: string;
  user: { username: string | null };
}

interface ScrapedProduct {
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  brand: string | null;
}

interface ProductEntry {
  url: string;
  scraped: ScrapedProduct | null;
  error: string | null;
  loading: boolean;
}

export default function AdminPostsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [selectedVideo, setSelectedVideo] = useState("");
  const [products, setProducts] = useState<ProductEntry[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: number } | null>(null);

  // Load merchants
  useEffect(() => {
    fetch("/api/admin/merchants")
      .then((r) => r.json())
      .then((data) => {
        if (data.merchants) setMerchants(data.merchants);
        else if (Array.isArray(data)) setMerchants(data);
      })
      .catch(() => {});
  }, []);

  // Load videos
  useEffect(() => {
    fetch("/api/admin/videos?status=READY&limit=100")
      .then((r) => r.json())
      .then((data) => {
        if (data.videos) setVideos(data.videos);
        else if (Array.isArray(data)) setVideos(data);
      })
      .catch(() => {});
  }, []);

  const handleScrape = async () => {
    const url = urlInput.trim();
    if (!url) return;

    const entry: ProductEntry = { url, scraped: null, error: null, loading: true };
    setProducts((prev) => [...prev, entry]);
    setUrlInput("");

    try {
      const res = await fetch("/api/admin/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setProducts((prev) =>
        prev.map((p) =>
          p.url === url ? { ...p, scraped: data, loading: false } : p
        )
      );
    } catch (err) {
      setProducts((prev) =>
        prev.map((p) =>
          p.url === url
            ? { ...p, error: err instanceof Error ? err.message : "Failed", loading: false }
            : p
        )
      );
    }
  };

  const removeProduct = (url: string) => {
    setProducts((prev) => prev.filter((p) => p.url !== url));
  };

  const handleSubmit = async () => {
    if (!selectedMerchant || !selectedVideo || products.length === 0) return;

    const validUrls = products.filter((p) => p.scraped).map((p) => p.url);
    if (validUrls.length === 0) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: selectedMerchant,
          videoId: selectedVideo,
          productUrls: validUrls,
        }),
      });
      const data = await res.json();
      setResult({
        created: data.created?.length ?? 0,
        errors: data.errors?.length ?? 0,
      });
      if (data.created?.length > 0) {
        setProducts([]);
      }
    } catch {
      setResult({ created: 0, errors: 1 });
    } finally {
      setSubmitting(false);
    }
  };

  const validProducts = products.filter((p) => p.scraped);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-text mb-6">Create Post</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Merchant selector */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">Merchant</label>
          <select
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text"
          >
            <option value="">Select a merchant...</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.storeName || m.shopifyDomain}
              </option>
            ))}
          </select>
        </div>

        {/* Video selector */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">Video</label>
          <select
            value={selectedVideo}
            onChange={(e) => setSelectedVideo(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text"
          >
            <option value="">Select a video...</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title || `Video by @${v.user?.username || "unknown"}`} ({v.status})
              </option>
            ))}
          </select>
        </div>

        {/* Product URL input */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">Product URLs</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              placeholder="Paste Shopify product URL..."
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-text"
            />
            <button
              onClick={handleScrape}
              disabled={!urlInput.trim()}
              className="px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              Scrape
            </button>
          </div>
        </div>

        {/* Product previews */}
        {products.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted">
              Products ({validProducts.length} ready)
            </p>
            {products.map((p) => (
              <div
                key={p.url}
                className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
              >
                {p.loading ? (
                  <div className="w-16 h-16 rounded-lg bg-surface animate-pulse flex-shrink-0" />
                ) : p.scraped?.images[0] ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                    <Image
                      src={p.scraped.images[0]}
                      alt={p.scraped.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-surface flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {p.loading ? (
                    <div className="space-y-1.5">
                      <div className="h-3 w-2/3 rounded bg-surface animate-pulse" />
                      <div className="h-3 w-1/3 rounded bg-surface animate-pulse" />
                    </div>
                  ) : p.error ? (
                    <p className="text-sm text-destructive">{p.error}</p>
                  ) : p.scraped ? (
                    <>
                      <p className="text-sm font-semibold text-text truncate">{p.scraped.title}</p>
                      {p.scraped.brand && (
                        <p className="text-xs text-muted">{p.scraped.brand}</p>
                      )}
                      <p className="text-sm font-bold text-text mt-0.5">
                        {p.scraped.currency} {p.scraped.price.toFixed(2)}
                      </p>
                    </>
                  ) : null}
                  <p className="text-[10px] text-muted truncate mt-1">{p.url}</p>
                </div>
                <button
                  onClick={() => removeProduct(p.url)}
                  className="text-muted hover:text-destructive transition-colors p-1 flex-shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedMerchant || !selectedVideo || validProducts.length === 0 || submitting}
          className="w-full py-3 bg-accent text-accent-fg text-sm font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creating..." : `Create Post (${validProducts.length} products)`}
        </button>

        {/* Result */}
        {result && (
          <div className={`p-3 rounded-lg text-sm ${result.created > 0 ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}>
            {result.created > 0
              ? `Created post with ${result.created} product(s).`
              : "Failed to create post."}
            {result.errors > 0 && ` ${result.errors} product(s) had errors.`}
          </div>
        )}
      </div>
    </div>
  );
}
