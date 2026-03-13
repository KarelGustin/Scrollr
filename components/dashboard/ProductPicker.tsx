"use client";

import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";

interface ProductPickerProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ProductPicker({ selectedIds, onSelectionChange }: ProductPickerProps) {
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
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted py-4 text-center">Loading products...</p>;
  }

  if (!products || products.length === 0) {
    return (
      <p className="text-sm text-muted py-4 text-center">
        No products yet. Create one first from the Products page.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 bg-surface border border-border rounded-[var(--radius)] text-text placeholder:text-muted text-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
      />
      <div className="max-h-60 overflow-y-auto space-y-1">
        {filtered.map((product: { id: string; name: string; brand?: string | null; priceDisplay?: string | null; price?: number | null }) => {
          const isSelected = selectedIds.includes(product.id);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => toggleProduct(product.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isSelected
                  ? "bg-accent/10 border border-accent/30"
                  : "hover:bg-card/50 border border-transparent"
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "bg-accent border-accent" : "border-border"
                }`}
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">{product.name}</p>
                <p className="text-xs text-muted">
                  {product.brand && `${product.brand} · `}
                  {product.priceDisplay ?? (product.price ? `€${product.price}` : "")}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-muted text-center">
          {selectedIds.length} product{selectedIds.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
