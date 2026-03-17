import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scrapeShopifyProduct } from "@/lib/scrape-product";

async function requireAdmin() {
  const user = await getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") return null;
  return user;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { merchantId, videoId, productUrls } = body;

  if (!merchantId || !videoId || !Array.isArray(productUrls) || productUrls.length === 0) {
    return NextResponse.json(
      { error: "merchantId, videoId, and productUrls[] are required" },
      { status: 400 }
    );
  }

  // Verify merchant exists
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true, userId: true },
  });
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Verify video exists
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true },
  });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const createdProducts: { id: string; title: string; url: string }[] = [];
  const errors: { url: string; error: string }[] = [];

  for (const url of productUrls) {
    try {
      const scraped = await scrapeShopifyProduct(url);
      const urlHash = crypto.createHash("md5").update(url).digest("hex").slice(0, 12);

      // Upsert MerchantProduct
      const scrapedId = `scraped-${urlHash}`;
      const merchantProduct = await prisma.merchantProduct.upsert({
        where: {
          merchantId_shopifyProductId_shopifyVariantId: {
            merchantId,
            shopifyProductId: scrapedId,
            shopifyVariantId: scrapedId,
          },
        },
        update: {
          title: scraped.title,
          description: scraped.description,
          imageUrl: scraped.images[0] ?? null,
          images: scraped.images,
          price: scraped.price,
          vendor: scraped.brand,
          productUrl: url,
          available: true,
        },
        create: {
          merchantId,
          shopifyProductId: scrapedId,
          shopifyVariantId: scrapedId,
          title: scraped.title,
          description: scraped.description,
          imageUrl: scraped.images[0] ?? null,
          images: scraped.images,
          price: scraped.price,
          vendor: scraped.brand,
          productUrl: url,
          available: true,
        },
      });

      // Create VideoProduct link (skip if already exists)
      await prisma.videoProduct.upsert({
        where: {
          videoId_merchantProductId: {
            videoId,
            merchantProductId: merchantProduct.id,
          },
        },
        update: {},
        create: {
          videoId,
          merchantProductId: merchantProduct.id,
          position: createdProducts.length,
        },
      });

      createdProducts.push({
        id: merchantProduct.id,
        title: scraped.title,
        url,
      });
    } catch (err) {
      errors.push({
        url,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    created: createdProducts,
    errors,
  });
}
