"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { useAddToCart } from "@/hooks/useCart";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";

interface RelatedProduct {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number;
  vendor: string | null;
}

interface ContextRelatedProductsProps {
  merchantProductId: string;
}

export default function ContextRelatedProducts({ merchantProductId }: ContextRelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const addToCart = useAddToCart();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/related?merchantProductId=${merchantProductId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [merchantProductId]);

  const handleAdd = (product: RelatedProduct) => {
    setAddingId(product.id);
    addToCart.mutate(
      { merchantProductId: product.id },
      {
        onSuccess: () => {
          setAddingId(null);
          setAddedId(product.id);
          setTimeout(() => setAddedId(null), 1200);
        },
        onError: () => {
          setAddingId(null);
        },
      }
    );
  };

  if (loading) {
    return (
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">
          More from this store
        </p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-12 h-12 rounded-lg bg-surface animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-surface animate-pulse" />
                <div className="h-3 w-1/3 rounded bg-surface animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">
        More from this store
      </p>
      <div className="space-y-2">
        {products.map((product) => {
          const isAdding = addingId === product.id;
          const isAdded = addedId === product.id;
          return (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-border/80 transition-colors"
            >
              {product.imageUrl ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-surface" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate">{product.title}</p>
                {product.vendor && (
                  <p className="text-xs text-muted truncate">{product.vendor}</p>
                )}
              </div>
              <span className="text-sm font-semibold text-text flex-shrink-0 mr-2">
                {formatPrice(product.price)}
              </span>
              <button
                onClick={() => handleAdd(product)}
                disabled={isAdding || isAdded}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  isAdded
                    ? "bg-green-500/15 text-green-500"
                    : "bg-accent text-accent-fg hover:bg-accent/90"
                }`}
              >
                {isAdding ? <ButtonSpinner className="h-3 w-3" /> : isAdded ? "Added" : "Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
