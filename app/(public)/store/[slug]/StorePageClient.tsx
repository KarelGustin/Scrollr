"use client";
import { useState } from "react";
import Link from "next/link";
import { CategoryChips } from "@/components/store/CategoryChips";
import { ProductGrid } from "@/components/store/ProductGrid";
import { StoreProductModal } from "@/components/store/StoreProductModal";
import FollowButton from "@/components/profile/FollowButton";

interface UgcVideo {
  id: string;
  thumbnailUrl: string | null;
  title: string | null;
  username: string | null;
}

interface StorePageClientProps {
  products: any[];
  categories: string[];
  isDark: boolean;
  merchantId: string;
  merchantUserId: string;
  ugcVideos: UgcVideo[];
  storeName: string;
}

export function StorePageClient({
  products,
  categories,
  isDark,
  merchantId,
  merchantUserId,
  ugcVideos,
  storeName,
}: StorePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const filtered = selectedCategory === "All"
    ? products
    : products.filter((p) => p.productType === selectedCategory);

  const newProducts = [...filtered]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const bestSelling = filtered.slice(0, 8);

  const text = isDark ? "text-white" : "text-[#1a1a1a]";
  const muted = isDark ? "text-white/40" : "text-[#999]";

  return (
    <>
      {/* Follow + stats bar */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="flex items-center justify-center gap-4">
          <div className="max-w-[180px]">
            <FollowButton creatorId={merchantUserId} />
          </div>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="mb-8">
          <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} isDark={isDark} />
        </div>
      )}

      {/* UGC Videos — premium horizontal scroll */}
      {ugcVideos.length > 0 && (
        <div className="mb-10">
          <div className="px-4 sm:px-6 flex items-end justify-between mb-4">
            <h2 className={`text-sm font-semibold uppercase tracking-[0.15em] ${isDark ? "text-white/50" : text}`}>
              As Seen In
            </h2>
            <span className={`text-[11px] font-medium tracking-wider uppercase ${muted}`}>
              {ugcVideos.length} videos
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto px-4 sm:px-6 pb-2 scrollbar-hide">
            {ugcVideos.map((video) => (
              <Link
                key={video.id}
                href={video.username ? `/@${video.username}/${video.id}` : "/discover"}
                className="relative shrink-0 w-28 sm:w-32 aspect-[9/16] rounded-xl overflow-hidden group"
              >
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title ?? "Video"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-[#f0eeeb]"}`}>
                    <svg className={`w-6 h-6 ${isDark ? "text-white/20" : "text-[#ccc]"}`} fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-2.5">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    {video.username && (
                      <span className="text-[10px] text-white/80 font-medium">@{video.username}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* New arrivals */}
      {newProducts.length > 0 && (
        <ProductGrid title="New Arrivals" products={newProducts} isDark={isDark} onProductClick={setSelectedProductId} columns={4} showAll={false} />
      )}

      {/* Separator */}
      {newProducts.length > 0 && bestSelling.length > 0 && (
        <div className="px-4 sm:px-6 mb-10">
          <div className={`h-px ${isDark ? "bg-white/[0.06]" : "bg-[#e8e5e0]"}`} />
        </div>
      )}

      {/* Best selling */}
      {bestSelling.length > 0 && (
        <ProductGrid title="Best Sellers" products={bestSelling} isDark={isDark} onProductClick={setSelectedProductId} columns={4} showAll={false} />
      )}

      {/* Separator */}
      {filtered.length > 8 && (
        <div className="px-4 sm:px-6 mb-10">
          <div className={`h-px ${isDark ? "bg-white/[0.06]" : "bg-[#e8e5e0]"}`} />
        </div>
      )}

      {/* All products */}
      <ProductGrid title="All Products" products={filtered} isDark={isDark} onProductClick={setSelectedProductId} columns={4} />

      {/* Footer */}
      <div className={`mt-16 mb-8 text-center px-4 ${isDark ? "text-white/20" : "text-[#ccc]"}`}>
        <div className={`h-px mb-8 ${isDark ? "bg-white/[0.06]" : "bg-[#e8e5e0]"}`} />
        <p className="text-[11px] font-medium tracking-[0.15em] uppercase mb-1">
          {storeName}
        </p>
        <p className="text-[10px] tracking-wider">
          Powered by Scrollr
        </p>
      </div>

      {/* Product modal */}
      {selectedProductId && (
        <StoreProductModal productId={selectedProductId} merchantId={merchantId} isDark={isDark} onClose={() => setSelectedProductId(null)} />
      )}
    </>
  );
}
