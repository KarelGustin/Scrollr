import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videos = await prisma.video.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { events: { where: { type: "VIDEO_START" } } },
      },
      products: {
        include: {
          product: {
            select: { id: true, name: true, brand: true, price: true, priceDisplay: true, imageUrl: true, affiliateUrl: true, description: true, sizes: true, published: true },
          },
          merchantProduct: {
            select: { id: true, title: true, description: true, imageUrl: true, price: true, compareAtPrice: true, vendor: true, productUrl: true, inventoryQuantity: true, available: true },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(videos);
}
