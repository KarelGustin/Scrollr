"use client";

import { useState } from "react";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    imageUrl: string | null;
    images?: string[];
    price: number;
    compareAtPrice: number | null;
    vendor?: string | null;
  };
  isDark: boolean;
  onClick: () => void;
  size?: "default" | "large";
}

export function ProductCard({ product, isDark, onClick, size = "default" }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0;
  const images = product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [];
  const showSecondImage = isHovered && images.length > 1;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="text-left w-full group"
    >
      <div className={`relative overflow-hidden ${
        size === "large" ? "aspect-[3/4] rounded-xl" : "aspect-[3/4] rounded-lg"
      } ${isDark ? "bg-white/[0.04]" : "bg-[#f5f3f0]"}`}>
        {/* Primary image */}
        {images.length > 0 && (
          <>
            <img
              src={images[0]}
              alt={product.title}
              onLoad={() => setImageLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              } ${showSecondImage ? "opacity-0 scale-105" : "group-hover:scale-[1.03]"}`}
            />
            {/* Second image on hover */}
            {images.length > 1 && (
              <img
                src={images[1]}
                alt={product.title}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                  showSecondImage ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              />
            )}
          </>
        )}

        {/* Skeleton */}
        {!imageLoaded && images.length > 0 && (
          <div className={`absolute inset-0 animate-pulse ${isDark ? "bg-white/10" : "bg-[#e8e5e0]"}`} />
        )}

        {/* No image placeholder */}
        {images.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className={`w-8 h-8 ${isDark ? "text-white/10" : "text-[#d4d0ca]"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5" />
            </svg>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-1 text-[10px] font-bold text-white bg-[#e63946] rounded-md tracking-wide">
              -{discountPct}%
            </span>
          </div>
        )}

        {/* Quick view indicator */}
        <div className={`absolute inset-x-0 bottom-0 flex items-center justify-center py-3 transition-all duration-300 ${
          isDark
            ? "bg-gradient-to-t from-black/60 to-transparent"
            : "bg-gradient-to-t from-black/40 to-transparent"
        } ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <span className="text-[11px] font-semibold text-white tracking-wider uppercase">Quick View</span>
        </div>
      </div>

      {/* Product info */}
      <div className="mt-2.5 px-0.5">
        {product.vendor && (
          <p className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-0.5 ${isDark ? "text-white/35" : "text-[#aaa]"}`}>
            {product.vendor}
          </p>
        )}
        <p className={`text-sm font-medium leading-snug line-clamp-2 ${isDark ? "text-white/90" : "text-[#1a1a1a]"}`}>
          {product.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm font-semibold ${
            hasDiscount
              ? "text-[#e63946]"
              : isDark ? "text-white/70" : "text-[#555]"
          }`}>
            €{product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className={`text-xs line-through ${isDark ? "text-white/30" : "text-[#bbb]"}`}>
              €{product.compareAtPrice!.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
