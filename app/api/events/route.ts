import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Simple in-memory rate limiting: max 100 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  return entry.count > 100;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  // Read viewer session from cart cookie for personalization tracking
  const viewerSessionId = req.cookies.get("cart_session")?.value ?? null;

  const body = await req.json();
  const events = body as {
    type: string;
    videoId?: string;
    productId?: string;
    metadata?: Record<string, unknown>;
    userId?: string;
  }[];

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { error: "Body must be a non-empty array of events" },
      { status: 400 }
    );
  }

  // Resolve userId from product or video if not provided
  const productIds = Array.from(
    new Set(
      events
        .filter((e) => e.productId && !e.userId)
        .map((e) => e.productId as string)
    )
  );

  const videoIds = Array.from(
    new Set(
      events
        .filter((e) => e.videoId && !e.userId)
        .map((e) => e.videoId as string)
    )
  );

  const productUserMap = new Map<string, string>();
  const videoUserMap = new Map<string, string>();

  if (productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, userId: true },
    });
    for (const p of products) {
      productUserMap.set(p.id, p.userId);
    }
  }

  if (videoIds.length > 0) {
    const videos = await prisma.video.findMany({
      where: { id: { in: videoIds } },
      select: { id: true, userId: true },
    });
    for (const v of videos) {
      videoUserMap.set(v.id, v.userId);
    }
  }

  const validTypes = [
    "PAGE_VIEW", "VIDEO_START", "VIDEO_COMPLETE",
    "SWIPE_NEXT", "SWIPE_PREV", "SHOP_CLICK",
    "ADD_TO_CART", "SHARE",
  ];

  const data = events
    .map((e) => {
      if (!validTypes.includes(e.type)) return null;
      const userId =
        e.userId ??
        (e.videoId ? videoUserMap.get(e.videoId) : undefined) ??
        (e.productId ? productUserMap.get(e.productId) : undefined);
      if (!userId) return null;
      return {
        type: e.type as "PAGE_VIEW" | "VIDEO_START" | "VIDEO_COMPLETE" | "SWIPE_NEXT" | "SWIPE_PREV" | "SHOP_CLICK" | "ADD_TO_CART" | "SHARE",
        videoId: e.videoId ?? null,
        productId: e.productId ?? null,
        metadata: (e.metadata as Prisma.InputJsonValue) ?? undefined,
        viewerSessionId,
        userId,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  if (data.length > 0) {
    await prisma.event.createMany({ data });
  }

  return NextResponse.json({ inserted: data.length });
}
