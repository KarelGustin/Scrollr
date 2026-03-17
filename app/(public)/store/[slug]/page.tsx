import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StorePageClient } from "./StorePageClient";

export default async function StorePage({ params }: { params: { slug: string } }) {
  const merchant = await prisma.merchant.findFirst({
    where: {
      active: true,
      OR: [{ slug: params.slug }, { id: params.slug }],
    },
    include: {
      merchantProducts: {
        where: { available: true },
        orderBy: { createdAt: "desc" },
      },
      user: {
        select: { id: true },
      },
    },
  });

  if (!merchant) notFound();

  // Fetch UGC videos tagged to this merchant's products
  const merchantProductIds = merchant.merchantProducts.map((mp) => mp.id);
  const ugcVideos = merchantProductIds.length > 0
    ? await prisma.video.findMany({
        where: {
          status: "READY",
          published: true,
          hlsUrl: { not: null },
          products: {
            some: {
              merchantProductId: { in: merchantProductIds },
            },
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
      })
    : [];

  const isDark = merchant.storeTheme === "dark";

  // Deduplicate by shopifyProductId (group variants, keep first)
  const productMap = new Map<string, any>();
  for (const mp of merchant.merchantProducts) {
    const key = mp.shopifyProductId;
    if (!productMap.has(key)) {
      productMap.set(key, {
        id: mp.id,
        shopifyProductId: mp.shopifyProductId,
        title: mp.title,
        imageUrl: mp.imageUrl,
        images: (mp.images as string[]) || (mp.imageUrl ? [mp.imageUrl] : []),
        price: mp.price,
        compareAtPrice: mp.compareAtPrice,
        productType: mp.productType,
        tags: mp.tags,
        createdAt: mp.createdAt,
      });
    }
  }

  const products = Array.from(productMap.values());
  const categorySet = new Set(products.map((p: any) => p.productType).filter(Boolean));
  const categories = Array.from(categorySet) as string[];

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#111] text-white" : "bg-[#FAFAF8] text-[#1a1a1a]"}`}>
      <div className="max-w-6xl mx-auto pb-20">
        <StoreHeader
          storeName={merchant.storeName || merchant.shopifyDomain}
          storeDescription={merchant.storeDescription}
          storeLogoUrl={merchant.storeLogoUrl}
          isDark={isDark}
        />
        <StorePageClient
          products={products}
          categories={categories}
          isDark={isDark}
          merchantId={merchant.id}
          merchantUserId={merchant.user.id}
          ugcVideos={ugcVideos.map((v) => ({
            id: v.id,
            thumbnailUrl: v.thumbnailUrl,
            title: v.title,
            username: v.user?.username ?? null,
          }))}
        />
      </div>
    </div>
  );
}
