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
}

export function StorePageClient({
  products,
  categories,
  isDark,
  merchantId,
  merchantUserId,
  ugcVideos,
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

  return (
    <>
      {/* Follow button */}
      <div className="px-4 sm:px-6 mb-4">
        <div className="max-w-xs">
          <FollowButton creatorId={merchantUserId} />
        </div>
      </div>

      <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} isDark={isDark} />

      {/* UGC Videos section */}
      {ugcVideos.length > 0 && (
        <div className="px-4 sm:px-6 mb-8">
          <h2 className={`text-lg font-display font-bold mb-3 ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>
            Videos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ugcVideos.map((video) => (
              <Link
                key={video.id}
                href={video.username ? `/@${video.username}/${video.id}` : `/discover`}
                className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black/10"
              >
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title ?? "Video"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface">
                    <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <ProductGrid title="New" products={newProducts} isDark={isDark} onProductClick={setSelectedProductId} />
      <ProductGrid title="Best Selling" products={bestSelling} isDark={isDark} onProductClick={setSelectedProductId} />
      <ProductGrid title="All Products" products={filtered} isDark={isDark} onProductClick={setSelectedProductId} />
      {selectedProductId && (
        <StoreProductModal productId={selectedProductId} merchantId={merchantId} isDark={isDark} onClose={() => setSelectedProductId(null)} />
      )}
    </>
  );
}
