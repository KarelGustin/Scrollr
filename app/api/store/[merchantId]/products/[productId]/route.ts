import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { merchantId: string; productId: string } }
) {
  const product = await prisma.merchantProduct.findUnique({
    where: { id: params.productId },
  });

  if (!product || product.merchantId !== params.merchantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const variants = await prisma.merchantProduct.findMany({
    where: {
      merchantId: params.merchantId,
      shopifyProductId: product.shopifyProductId,
      available: true,
    },
    orderBy: { price: "asc" },
  });

  const variantIds = variants.map((v) => v.id);
  const ugcVideos = await prisma.video.findMany({
    where: {
      status: "READY",
      published: true,
      products: { some: { merchantProductId: { in: variantIds } } },
    },
    include: {
      user: { select: { username: true } },
      score: { select: { totalViews: true } },
    },
    orderBy: { score: { totalViews: "desc" } },
    take: 10,
  });

  return NextResponse.json({ product, variants, ugcVideos });
}
