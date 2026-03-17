import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/recommendations
 * Returns "more like this" products based on co-views and category affinity.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json([], { status: 200 });
  }

  // Find products from the same video's categories
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      products: {
        select: {
          merchantProduct: {
            select: { merchantId: true, productType: true },
          },
        },
      },
    },
  });

  if (!video) {
    return NextResponse.json([], { status: 200 });
  }

  const merchantIds = video.products
    .map((vp) => vp.merchantProduct?.merchantId)
    .filter(Boolean) as string[];

  const productTypes = video.products
    .map((vp) => vp.merchantProduct?.productType)
    .filter(Boolean) as string[];

  const related = await prisma.merchantProduct.findMany({
    where: {
      available: true,
      OR: [
        ...(merchantIds.length > 0 ? [{ merchantId: { in: merchantIds } }] : []),
        ...(productTypes.length > 0 ? [{ productType: { in: productTypes } }] : []),
      ],
    },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      price: true,
      vendor: true,
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(related);
}
