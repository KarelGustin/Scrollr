import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const merchantProduct = await prisma.merchantProduct.findUnique({
    where: { id },
    include: {
      merchant: {
        select: {
          id: true,
          storeName: true,
          storeLogoUrl: true,
          shippingPolicy: true,
          returnPolicy: true,
        },
      },
    },
  });

  if (!merchantProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Fetch other variants of the same shopify product from the same merchant
  const variants = await prisma.merchantProduct.findMany({
    where: {
      merchantId: merchantProduct.merchantId,
      shopifyProductId: merchantProduct.shopifyProductId,
      id: { not: merchantProduct.id },
      available: true,
    },
    orderBy: { price: "asc" },
  });

  return NextResponse.json({
    ...merchantProduct,
    variants,
  });
}
