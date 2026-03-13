import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeVideoScores,
  areScoresStale,
  getViewerInterests,
  calculatePersonalizationBoost,
} from "@/lib/recommendation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  // Recompute scores if stale
  const stale = await areScoresStale();
  if (stale) {
    await computeVideoScores();
  }

  // Get viewer session for personalization
  const viewerSessionId = req.cookies.get("cart_session")?.value;
  const viewerInterests = viewerSessionId
    ? await getViewerInterests(viewerSessionId)
    : new Map<string, number>();

  // Fetch all eligible videos with scores and product tags
  const videos = await prisma.video.findMany({
    where: {
      status: "READY",
      published: true,
      hlsUrl: { not: null },
      products: { some: {} },
    },
    include: {
      user: {
        select: { username: true, name: true, avatarUrl: true },
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
              tags: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
      score: true,
    },
  });

  // Score and sort with personalization
  const scored = videos.map((v) => {
    const baseScore = v.score?.score ?? 0.5; // cold start default

    // Collect all tags from this video's products
    const videoTags = v.products
      .flatMap((vp) =>
        vp.product.tags
          ? vp.product.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
          : []
      );

    const boost = calculatePersonalizationBoost(videoTags, viewerInterests);
    const finalScore = baseScore * boost;

    // Add slight randomization within tiers to prevent stale ordering
    const jitter = (Math.random() - 0.5) * 0.05;

    return { video: v, finalScore: finalScore + jitter };
  });

  // Sort by final score descending
  scored.sort((a, b) => b.finalScore - a.finalScore);

  // Apply cursor-based pagination using index position
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = scored.findIndex((s) => s.video.id === cursor);
    if (cursorIndex >= 0) startIndex = cursorIndex + 1;
  }

  const page = scored.slice(startIndex, startIndex + limit + 1);
  const hasMore = page.length > limit;
  const items = hasMore ? page.slice(0, limit) : page;
  const nextCursor = hasMore ? items[items.length - 1].video.id : null;

  const feed = items.map((s) => ({
    id: s.video.id,
    hlsUrl: s.video.hlsUrl!,
    thumbnailUrl: s.video.thumbnailUrl,
    duration: s.video.duration,
    user: s.video.user,
    products: s.video.products.map((vp) => ({
      id: vp.product.id,
      name: vp.product.name,
      brand: vp.product.brand,
      price: vp.product.price,
      priceDisplay: vp.product.priceDisplay,
      imageUrl: vp.product.imageUrl,
      affiliateUrl: vp.product.affiliateUrl,
    })),
  }));

  return NextResponse.json({ items: feed, nextCursor });
}
