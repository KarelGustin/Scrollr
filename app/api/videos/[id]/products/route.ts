import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Add/replace products on a video
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!video || video.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { productIds, merchantProductIds, merchantProducts } = body as {
    productIds?: string[];
    merchantProductIds?: string[];
    merchantProducts?: { merchantProductId: string; creatorTaggedSize?: string | null }[];
  };

  const hasProductIds = Array.isArray(productIds) && productIds.length > 0;
  const hasMerchantProductIds =
    Array.isArray(merchantProductIds) && merchantProductIds.length > 0;
  const hasMerchantProducts =
    Array.isArray(merchantProducts) && merchantProducts.length > 0;

  if (!hasProductIds && !hasMerchantProductIds && !hasMerchantProducts) {
    return NextResponse.json(
      { error: "productIds, merchantProductIds, or merchantProducts must be provided as an array" },
      { status: 400 }
    );
  }

  const totalProducts =
    (hasProductIds ? productIds.length : 0) +
    (hasMerchantProducts
      ? merchantProducts.length
      : hasMerchantProductIds
        ? merchantProductIds.length
        : 0);

  if (totalProducts > 7) {
    return NextResponse.json(
      { error: "Maximum 7 products per video" },
      { status: 400 }
    );
  }

  // Build the list of VideoProduct records to create
  const videoProductData: {
    videoId: string;
    productId?: string;
    merchantProductId?: string;
    creatorTaggedSize?: string | null;
    position: number;
  }[] = [];

  let position = 0;

  // Verify creator-owned products belong to this user
  if (hasProductIds) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, userId: user.id },
      select: { id: true },
    });
    const validIds = new Set(products.map((p) => p.id));
    for (const pid of productIds) {
      if (validIds.has(pid)) {
        videoProductData.push({
          videoId: id,
          productId: pid,
          position: position++,
        });
      }
    }
  }

  // Verify merchant products exist and are available (no ownership check needed)
  if (hasMerchantProductIds || hasMerchantProducts) {
    const merchantProductsPayload: {
      merchantProductId: string;
      creatorTaggedSize?: string | null;
    }[] = hasMerchantProducts
      ? merchantProducts
      : (merchantProductIds ?? []).map((merchantProductId) => ({ merchantProductId }));
    const availableMerchantProducts = await prisma.merchantProduct.findMany({
      where: {
        id: {
          in: merchantProductsPayload.map((product) => product.merchantProductId),
        },
        available: true,
      },
      select: { id: true },
    });
    const validMerchantIds = new Set(availableMerchantProducts.map((mp) => mp.id));
    for (const product of merchantProductsPayload) {
      if (validMerchantIds.has(product.merchantProductId)) {
        videoProductData.push({
          videoId: id,
          merchantProductId: product.merchantProductId,
          creatorTaggedSize: product.creatorTaggedSize?.trim() || null,
          position: position++,
        });
      }
    }
  }

  // Replace all video-product links
  await prisma.$transaction([
    prisma.videoProduct.deleteMany({ where: { videoId: id } }),
    prisma.videoProduct.createMany({ data: videoProductData }),
  ]);

  const updated = await prisma.video.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true,
          merchantProduct: {
            include: {
              merchant: {
                select: { id: true, storeName: true, storeLogoUrl: true },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  return NextResponse.json(updated);
}
