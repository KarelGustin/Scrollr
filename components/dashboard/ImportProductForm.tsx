"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCreateProduct } from "@/hooks/useProducts";

export function ImportProductForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

    try {
      await createProduct.mutateAsync({
        name: preview.name,
        brand: preview.brand ?? undefined,
        price: preview.price ?? undefined,
        affiliateUrl: preview.affiliateUrl,
        description: preview.description ?? undefined,
        imageUrl: preview.imageUrl ?? undefined,
      });
      setPreview(null);
      setUrl("");
    } catch {
      setError("Failed to save product");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Paste product URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleImport} loading={loading} disabled={!url.trim()}>
          Import
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

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              loading={createProduct.isPending}
              className="flex-1"
              size="sm"
            >
              Save Product
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPreview(null)}
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
