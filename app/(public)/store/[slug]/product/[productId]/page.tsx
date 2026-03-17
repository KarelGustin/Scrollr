import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductDetailClient } from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string; productId: string };
}) {
  const product = await prisma.merchantProduct.findUnique({
    where: { id: params.productId },
    include: {
      merchant: {
        select: {
          id: true,
          slug: true,
          storeName: true,
          shopifyDomain: true,
          storeTheme: true,
        },
      },
    },
  });

  if (!product) notFound();

  // Fetch all variants (same shopifyProductId)
  const variants = await prisma.merchantProduct.findMany({
    where: {
      merchantId: product.merchantId,
      shopifyProductId: product.shopifyProductId,
      available: true,
    },
    select: {
      id: true,
      title: true,
      price: true,
      compareAtPrice: true,
      shopifyVariantId: true,
    },
    orderBy: { price: "asc" },
  });

  // Fetch UGC videos tagged with this product
  const taggedVideos = await prisma.video.findMany({
    where: {
      status: "READY",
      published: true,
      hlsUrl: { not: null },
      products: {
        some: { merchantProductId: product.id },
      },
    },
    select: {
      id: true,
      thumbnailUrl: true,
      title: true,
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const isDark = product.merchant.storeTheme === "dark";
  const images = (product.images as string[] | null) ?? (product.imageUrl ? [product.imageUrl] : []);

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#111] text-white" : "bg-[#FAFAF8] text-[#1a1a1a]"}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link
            href={`/store/${product.merchant.slug || product.merchant.id}`}
            className={`hover:underline ${isDark ? "text-white/60" : "text-[#1a1a1a]/60"}`}
          >
            {product.merchant.storeName || product.merchant.shopifyDomain}
          </Link>
          <span className={`mx-2 ${isDark ? "text-white/30" : "text-[#1a1a1a]/30"}`}>/</span>
          <span className={isDark ? "text-white" : "text-[#1a1a1a]"}>{product.title}</span>
        </nav>

        <ProductDetailClient
          product={{
            id: product.id,
            title: product.title,
            description: product.description,
            images,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            vendor: product.vendor,
          }}
          variants={variants.map((v) => ({
            id: v.id,
            title: v.title,
            price: v.price,
          }))}
          isDark={isDark}
        />

        {/* UGC Videos */}
        {taggedVideos.length > 0 && (
          <div className="mt-10">
            <h2 className={`text-lg font-display font-bold mb-3 ${isDark ? "text-white" : "text-[#1a1a1a]"}`}>
              See it in action
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {taggedVideos.map((video) => (
                <Link
                  key={video.id}
                  href={video.user?.username ? `/@${video.user.username}/${video.id}` : "/discover"}
                  className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black/10"
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title ?? "Video"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-black/5"}`}>
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
      </div>
    </div>
  );
}
