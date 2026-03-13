"use client";

import { useState } from "react";
import { useCreateProduct } from "@/hooks/useProducts";

interface InlineProductLinkProps {
  onProductCreated: () => void;
  onCancel: () => void;
}

export function InlineProductLink({ onProductCreated, onCancel }: InlineProductLinkProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sizesInput, setSizesInput] = useState("");
  const [preview, setPreview] = useState<{
    name: string;
    description: string | null;
    imageUrl: string | null;
    price: string | null;
    brand: string | null;
    affiliateUrl: string;
    sizes: string[] | null;
    availability: string | null;
  } | null>(null);

  const createProduct = useCreateProduct();

  const handleFetch = async () => {
    if (!url.trim()) return;

    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");
    setPreview(null);

    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to fetch product");
        return;
      }

      const data = await res.json();
      setPreview(data);
      if (data.sizes?.length) {
        setSizesInput(data.sizes.join(", "));
      }
    } catch {
      setError("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    const sizes = sizesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await createProduct.mutateAsync({
        name: preview.name,
        brand: preview.brand ?? undefined,
        price: preview.price ?? undefined,
        affiliateUrl: preview.affiliateUrl,
        description: preview.description ?? undefined,
        imageUrl: preview.imageUrl ?? undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
      });
      onProductCreated();
    } catch {
      setError("Failed to save product");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text">Link new product</p>
        <button onClick={onCancel} className="text-xs text-muted hover:text-text transition-colors">
          Cancel
        </button>
      </div>

      {!preview ? (
        <>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste store link..."
              className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/50"
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            />
            <button
              onClick={handleFetch}
              disabled={loading || !url.trim()}
              className="px-4 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors flex-shrink-0"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                "Fetch"
              )}
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </>
      ) : (
        <>
          {/* Product preview */}
          <div className="flex gap-3">
            {preview.imageUrl && (
              <img src={preview.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text truncate">{preview.name}</p>
              {preview.brand && <p className="text-xs text-muted">{preview.brand}</p>}
              {preview.price && <p className="text-sm text-accent font-medium mt-0.5">{preview.price}</p>}
              {preview.description && <p className="text-xs text-muted mt-1 line-clamp-2">{preview.description}</p>}
              {preview.availability && (
                <p className={`text-xs mt-1 ${preview.availability === "InStock" ? "text-success" : "text-warning"}`}>
                  {preview.availability === "InStock" ? "In Stock" : preview.availability}
                </p>
              )}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="text-xs text-muted block mb-1">Sizes (comma-separated)</label>
            <input
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              placeholder="e.g. XS, S, M, L, XL"
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/50"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={createProduct.isPending}
              className="flex-1 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-accent/90 transition-colors"
            >
              {createProduct.isPending ? "Saving..." : "Save & Link"}
            </button>
            <button
              onClick={() => { setPreview(null); setUrl(""); setSizesInput(""); }}
              className="px-4 py-2.5 text-sm text-muted hover:text-text transition-colors"
            >
              Back
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </>
      )}
    </div>
  );
}
