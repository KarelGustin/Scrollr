"use client";

import { useState } from "react";
import Image from "next/image";
import { useAddToCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";

interface ProductDetailClientProps {
  product: {
    id: string;
    title: string;
    description: string | null;
    images: string[];
    price: number;
    compareAtPrice: number | null;
    vendor: string | null;
  };
  variants: { id: string; title: string; price: number }[];
  isDark: boolean;
}

export function ProductDetailClient({ product, variants, isDark }: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  );
  const [addedToCart, setAddedToCart] = useState(false);
  const addToCart = useAddToCart();

  const hasSizes = variants.length > 1;
  const currentVariantTitle = variants.find((v) => v.id === selectedVariant)?.title;

  const handleAddToCart = () => {
    const mpId = selectedVariant ?? product.id;
    addToCart.mutate(
      { merchantProductId: mpId, selectedSize: currentVariantTitle },
      {
        onSuccess: () => {
          setAddedToCart(true);
          setTimeout(() => setAddedToCart(false), 1200);
        },
      }
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Image carousel */}
      <div>
        {product.images.length > 0 ? (
          <>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface">
              <Image
                src={product.images[selectedImage]}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      i === selectedImage
                        ? isDark ? "border-white" : "border-[#1a1a1a]"
                        : "border-transparent"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="aspect-square rounded-2xl bg-surface flex items-center justify-center">
            <svg className="w-16 h-16 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product info */}
      <div>
        <h1 className={`text-2xl font-display font-bold ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>
          {product.title}
        </h1>
        {product.vendor && (
          <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-[#1a1a1a]/60"}`}>
            {product.vendor}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span className={`text-xl font-bold ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice != null && product.compareAtPrice > product.price && (
            <span className={`text-sm line-through ${isDark ? "text-white/40" : "text-[#1a1a1a]/40"}`}>
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Size/variant picker */}
        {hasSizes && (
          <div className="mt-5">
            <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${isDark ? "text-white/50" : "text-[#1a1a1a]/50"}`}>
              Size
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    selectedVariant === v.id
                      ? isDark
                        ? "border-white bg-white/10 text-white"
                        : "border-[#1a1a1a] bg-[#1a1a1a]/10 text-[#1a1a1a]"
                      : isDark
                        ? "border-white/20 text-white/70 hover:border-white/40"
                        : "border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:border-[#1a1a1a]/40"
                  }`}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAddToCart}
            disabled={addToCart.isPending || addedToCart}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 ${
              addedToCart
                ? "border-green-500/30 bg-green-500/10 text-green-500"
                : isDark
                  ? "border-white/20 text-white hover:bg-white/5"
                  : "border-[#1a1a1a]/20 text-[#1a1a1a] hover:bg-[#1a1a1a]/5"
            }`}
          >
            {addToCart.isPending ? <ButtonSpinner /> : addedToCart ? "Added to Cart" : "Add to Cart"}
          </button>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-8">
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>
              Description
            </h3>
            <p className={`text-sm leading-relaxed ${isDark ? "text-white/70" : "text-[#1a1a1a]/70"}`}>
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
