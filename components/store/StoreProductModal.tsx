"use client";
import { useEffect, useState } from "react";
import { UGCRow } from "./UGCRow";

interface MerchantProduct {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  images: unknown;
  price: number;
  compareAtPrice: number | null;
  vendor: string | null;
  shopifyProductId: string;
}

interface UGCVideo {
  id: string;
  thumbnailUrl: string | null;
  user: { username: string } | null;
  score: { totalViews: number } | null;
}

interface StoreProductModalProps {
  productId: string;
  merchantId: string;
  isDark: boolean;
  onClose: () => void;
}

export function StoreProductModal({ productId, merchantId, isDark, onClose }: StoreProductModalProps) {
  const [product, setProduct] = useState<MerchantProduct | null>(null);
  const [variants, setVariants] = useState<MerchantProduct[]>([]);
  const [ugcVideos, setUgcVideos] = useState<UGCVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setImageIndex(0);
    setSelectedVariant(null);
    setCartSuccess(false);

    fetch(`/api/store/${merchantId}/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data.product);
        setVariants(data.variants || []);
        setUgcVideos(data.ugcVideos || []);
        if (data.variants?.length > 0) setSelectedVariant(data.variants[0].id);
      })
      .finally(() => setLoading(false));
  }, [productId, merchantId]);

  const images: string[] = product
    ? ((product.images as string[]) || (product.imageUrl ? [product.imageUrl] : []))
    : [];

  const selectedVariantData = variants.find((v) => v.id === selectedVariant) || product;
  const price = selectedVariantData?.price ?? 0;
  const compareAtPrice = selectedVariantData?.compareAtPrice ?? null;
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPct = hasDiscount ? Math.round((1 - price / compareAtPrice!) * 100) : 0;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setAddingToCart(true);
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantProductId: selectedVariant, quantity: 1 }),
      });
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 2000);
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleSection = (section: string) =>
    setOpenSection((prev) => (prev === section ? null : section));

  const bg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const text = isDark ? "text-white" : "text-[#1a1a1a]";
  const muted = isDark ? "text-white/50" : "text-[#999]";
  const border = isDark ? "border-white/10" : "border-[#e5e5e5]";
  const chipBase = isDark ? "border-white/20 text-white/60" : "border-[#e5e5e5] text-[#666]";
  const chipSelected = isDark ? "bg-white text-[#111] border-white" : "bg-[#1a1a1a] text-white border-[#1a1a1a]";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 ${bg} rounded-t-2xl max-h-[90vh] overflow-y-auto`}
        style={{ boxShadow: "0 -4px 32px rgba(0,0,0,0.18)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-9 h-1 rounded-full ${isDark ? "bg-white/20" : "bg-[#ddd]"}`} />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-white/10 text-white/60" : "bg-[#f0eeeb] text-[#888]"}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="p-6 pb-10">
            {/* Skeleton */}
            <div className={`aspect-square rounded-xl mb-4 animate-pulse ${isDark ? "bg-white/10" : "bg-[#f0eeeb]"}`} />
            <div className={`h-4 w-1/3 rounded mb-2 animate-pulse ${isDark ? "bg-white/10" : "bg-[#f0eeeb]"}`} />
            <div className={`h-6 w-2/3 rounded mb-2 animate-pulse ${isDark ? "bg-white/10" : "bg-[#f0eeeb]"}`} />
            <div className={`h-4 w-1/4 rounded animate-pulse ${isDark ? "bg-white/10" : "bg-[#f0eeeb]"}`} />
          </div>
        ) : product ? (
          <div className="px-5 pb-10">
            {/* Image carousel */}
            {images.length > 0 && (
              <div className="mb-4">
                <div className={`aspect-square rounded-xl overflow-hidden ${isDark ? "bg-white/5" : "bg-[#f0eeeb]"}`}>
                  <img
                    src={images[imageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIndex(i)}
                        className={`rounded-full transition-all ${
                          i === imageIndex
                            ? `w-4 h-1.5 ${isDark ? "bg-white" : "bg-[#1a1a1a]"}`
                            : `w-1.5 h-1.5 ${isDark ? "bg-white/30" : "bg-[#ccc]"}`
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Brand + title + price */}
            {product.vendor && (
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>
                {product.vendor}
              </p>
            )}
            <h2 className={`text-lg font-bold leading-snug ${text}`}>{product.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 mb-4">
              <span className={`text-base font-semibold ${text}`}>€{price.toFixed(2)}</span>
              {hasDiscount && (
                <>
                  <span className={`text-sm line-through ${muted}`}>€{compareAtPrice!.toFixed(2)}</span>
                  <span className="text-xs font-bold text-white bg-[#e63946] px-1.5 py-0.5 rounded">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>

            {/* Variant chips */}
            {variants.length > 1 && (
              <div className="mb-5">
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>Select</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedVariant === v.id ? chipSelected : chipBase
                      }`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !selectedVariant}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all mb-5 ${
                cartSuccess
                  ? "bg-green-500 text-white"
                  : isDark
                  ? "bg-white text-[#111] hover:bg-white/90 disabled:opacity-40"
                  : "bg-[#1a1a1a] text-white hover:bg-[#333] disabled:opacity-40"
              }`}
            >
              {cartSuccess
                ? "Added to cart!"
                : addingToCart
                ? "Adding..."
                : `Add to Cart — €${price.toFixed(2)}`}
            </button>

            {/* UGC row */}
            <UGCRow videos={ugcVideos} isDark={isDark} />

            {/* Collapsible sections */}
            <div className={`mt-5 border-t ${border}`}>
              {[
                { key: "description", label: "Description", content: product.description },
                { key: "sizing", label: "Sizing & Fit", content: "Please refer to the size guide for accurate measurements. If you are between sizes, we recommend sizing up." },
                { key: "shipping", label: "Shipping & Returns", content: "Free shipping on orders over €75. Standard delivery 3–5 business days. Returns accepted within 30 days of delivery." },
              ].map(({ key, label, content }) =>
                content ? (
                  <div key={key} className={`border-b ${border}`}>
                    <button
                      onClick={() => toggleSection(key)}
                      className={`w-full flex items-center justify-between py-3.5 text-sm font-medium ${text}`}
                    >
                      {label}
                      <svg
                        className={`w-4 h-4 transition-transform ${openSection === key ? "rotate-180" : ""} ${muted}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openSection === key && (
                      <p className={`text-sm pb-4 leading-relaxed ${muted}`}>{content}</p>
                    )}
                  </div>
                ) : null
              )}
            </div>
          </div>
        ) : (
          <div className={`p-10 text-center ${muted} text-sm`}>Product not found.</div>
        )}
      </div>
    </>
  );
}
