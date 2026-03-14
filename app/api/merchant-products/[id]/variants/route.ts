import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const merchantProduct = await prisma.merchantProduct.findUnique({
    where: { id },
    select: { merchantId: true, shopifyProductId: true },
  });

  if (!merchantProduct) {
    return NextResponse.json([], { status: 200 });
  }

  // Fetch all variants of the same Shopify product from the same merchant
  const variants = await prisma.merchantProduct.findMany({
    where: {
      merchantId: merchantProduct.merchantId,
      shopifyProductId: merchantProduct.shopifyProductId,
      shopifyVariantId: { not: null },
    },
    select: {
      id: true,
      title: true,
      shopifyVariantId: true,
      price: true,
      sku: true,
      available: true,
      inventoryQuantity: true,
    },
    orderBy: { price: "asc" },
  });

  return NextResponse.json(variants);
}
