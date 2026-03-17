import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchantProductId = searchParams.get("merchantProductId");

  if (!merchantProductId) {
    return NextResponse.json([], { status: 200 });
  }

  const product = await prisma.merchantProduct.findUnique({
    where: { id: merchantProductId },
    select: { merchantId: true, productType: true },
  });

  if (!product) {
    return NextResponse.json([], { status: 200 });
  }

  const related = await prisma.merchantProduct.findMany({
    where: {
      merchantId: product.merchantId,
      available: true,
      id: { not: merchantProductId },
      ...(product.productType ? { productType: product.productType } : {}),
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
