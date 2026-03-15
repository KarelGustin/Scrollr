import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type"); // "videos" | "products" | "creators" | "stores" | null (all)

  if (!q || q.length === 0) {
    return NextResponse.json({ videos: [], products: [], creators: [], merchants: [] });
  }

  // Limit query length to prevent abuse
  const query = q.slice(0, 100);

  const shouldSearch = (t: string) => !type || type === t;

  const [videos, products, creators, merchants] = await Promise.all([
    shouldSearch("videos")
      ? prisma.video.findMany({
          where: {
            status: "READY",
            published: true,
            hlsUrl: { not: null },
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          include: {
            user: {
              select: {
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
            products: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                    price: true,
                    priceDisplay: true,
                    imageUrl: true,
                    affiliateUrl: true,
                    published: true,
                  },
                },
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [],

    shouldSearch("products")
      ? prisma.product.findMany({
          where: {
            published: true,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { brand: { contains: query, mode: "insensitive" } },
              { tags: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          include: {
            user: {
              select: {
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [],

    shouldSearch("creators")
      ? prisma.user.findMany({
          where: {
            role: "CREATOR",
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { bio: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            bio: true,
            _count: {
              select: {
                videos: {
                  where: { status: "READY", published: true },
                },
                products: {
                  where: { published: true },
                },
              },
            },
          },
          take: 20,
        })
      : [],

    shouldSearch("stores")
      ? prisma.merchant.findMany({
          where: {
            active: true,
            slug: { not: null },
            OR: [
              { storeName: { contains: query, mode: "insensitive" } },
              { shopifyDomain: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            slug: true,
            storeName: true,
            storeLogoUrl: true,
            _count: {
              select: {
                merchantProducts: {
                  where: { available: true },
                },
              },
            },
          },
          take: 20,
        })
      : [],
  ]);

  return NextResponse.json({ videos, products, creators, merchants });
}
