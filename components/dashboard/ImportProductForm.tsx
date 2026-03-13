"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateProduct } from "@/hooks/useProducts";

export function ImportProductForm() {
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
  } | null>(null);

  const createProduct = useCreateProduct();

  const handleImport = async () => {
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
        setError(data.error ?? "Failed to import");
        return;
      }

      const data = await res.json();
      setPreview(data);
    } catch {
      setError("Failed to import product");
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
      setPreview(null);
      setUrl("");
      setSizesInput("");
    } catch {
      setError("Failed to save product");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Paste store link (e.g. https://shop.com/product)..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleImport} loading={loading} disabled={!url.trim()}>
          Link
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {preview && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex gap-3">
            {preview.imageUrl && (
              <img
                src={preview.imageUrl}
                alt={preview.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text">{preview.name}</p>
              {preview.brand && (
                <p className="text-xs text-muted">{preview.brand}</p>
              )}
              {preview.price && (
                <p className="text-sm text-accent font-medium mt-0.5">
                  {preview.price}
                </p>
              )}
              {preview.description && (
                <p className="text-xs text-muted mt-1 line-clamp-2">
                  {preview.description}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1.5">Available sizes (comma-separated)</label>
            <Input
              placeholder="e.g. XS, S, M, L, XL"
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              loading={createProduct.isPending}
              className="flex-1"
              size="sm"
            >
              Link Product
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setPreview(null); setSizesInput(""); }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
