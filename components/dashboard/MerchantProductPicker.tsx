"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface MerchantProduct {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  vendor: string | null;
  productType: string | null;
  merchant: {
    id: string;
    storeName: string;
    storeLogoUrl: string | null;
  };
}

interface MerchantProductPickerProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelections?: number;
}

async function fetchMerchantProducts(search: string): Promise<MerchantProduct[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (search.trim()) {
    params.set("search", search.trim());
  }
  const res = await fetch(`/api/merchant-products?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch merchant products");
  const data = await res.json();
  return data.products;
}

export function MerchantProductPicker({
  selectedIds,
  onSelectionChange,
  maxSelections = 7,
}: MerchantProductPickerProps) {
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["merchant-products", search],
    queryFn: () => fetchMerchantProducts(search),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    return products;
  }, [products]);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else if (selectedIds.length < maxSelections) {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(price);
    } catch {
      return `$${price.toFixed(2)}`;
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted">Loading products...</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <p className="text-sm text-muted py-4 text-center">
        No merchant products available yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-muted text-sm focus:outline-none focus:border-accent/50"
      />

      <div className="max-h-52 overflow-y-auto space-y-1 -mx-1 px-1">
        {filtered.map((product) => {
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
              {/* Product image with selection indicator */}
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted"
                    >
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-accent/60 flex items-center justify-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">
                  {product.title}
                </p>
                <p className="text-xs text-muted truncate">
                  {product.vendor && `${product.vendor} · `}
                  {formatPrice(product.price, product.currency)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted text-center">
        {selectedIds.length}/{maxSelections} products selected
      </p>
    </div>
  );
}
