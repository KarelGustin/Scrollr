"use client";

import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";

interface ProductPickerProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelections?: number;
}

export function ProductPicker({ selectedIds, onSelectionChange, maxSelections = 7 }: ProductPickerProps) {
  const { data: products, isLoading } = useProducts();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p: { name: string; brand?: string | null }) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    );
  }, [products, search]);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else if (selectedIds.length < maxSelections) {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted py-4 text-center">Loading products...</p>;
  }

  if (!products || products.length === 0) {
    return (
      <p className="text-sm text-muted py-4 text-center">
        No linked products yet. Link one from a store below.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Search your products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-muted text-sm focus:outline-none focus:border-accent/50"
      />
      <div className="max-h-52 overflow-y-auto space-y-1 -mx-1 px-1">
        {filtered.map((product: { id: string; name: string; brand?: string | null; priceDisplay?: string | null; price?: number | null; imageUrl?: string | null }) => {
          const isSelected = selectedIds.includes(product.id);
          const isDisabled = !isSelected && selectedIds.length >= maxSelections;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => !isDisabled && toggleProduct(product.id)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${
                isSelected
                  ? "bg-accent/10 border border-accent/30"
                  : isDisabled
                  ? "opacity-40 cursor-not-allowed border border-transparent"
                  : "hover:bg-surface border border-transparent"
              }`}
            >
              {/* Product image or checkbox */}
              {product.imageUrl ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-accent/60 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "bg-accent border-accent" : "border-border"
                  }`}
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">{product.name}</p>
                <p className="text-xs text-muted">
                  {product.brand && `${product.brand} · `}
                  {product.priceDisplay ?? (product.price ? `$${product.price}` : "")}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-muted text-center">
          {selectedIds.length}/{maxSelections} products selected
        </p>
      )}
    </div>
  );
}
