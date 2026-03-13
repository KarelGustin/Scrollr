import { prisma } from "@/lib/prisma";

// Weights for score computation
const WEIGHTS = {
  watchCompletion: 0.4,
  cartRate: 0.25,
  shopClickRate: 0.15,
  shareRate: 0.1,
  recency: 0.1,
};

const COLD_START_THRESHOLD = 5; // Minimum views before score is trusted
const COLD_START_SCORE = 0.5;
const RECENCY_HALF_LIFE_DAYS = 14;
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/**
 * Compute engagement scores for all published videos.
 * Aggregates events and writes to the VideoScore table.
 */
export async function computeVideoScores(): Promise<void> {
  // Get all published READY videos
  const videos = await prisma.video.findMany({
    where: { status: "READY", published: true },
    select: { id: true, createdAt: true },
  });

  if (videos.length === 0) return;

  const videoIds = videos.map((v) => v.id);

  // Aggregate events per video in a single query
  const eventCounts = await prisma.event.groupBy({
    by: ["videoId", "type"],
    where: {
      videoId: { in: videoIds },
      type: { in: ["VIDEO_START", "VIDEO_COMPLETE", "ADD_TO_CART", "SHOP_CLICK", "SHARE"] },
    },
    _count: { id: true },
  });

  // Get average watch percentage from VIDEO_COMPLETE metadata
  const completeEvents = await prisma.event.findMany({
    where: {
      videoId: { in: videoIds },
      type: "VIDEO_COMPLETE",
      metadata: { not: undefined },
    },
    select: { videoId: true, metadata: true },
  });

  // Build per-video stats
  const statsMap = new Map<string, {
    views: number;
    carts: number;
    clicks: number;
    shares: number;
    watchPercentages: number[];
  }>();

  for (const vid of videoIds) {
    statsMap.set(vid, { views: 0, carts: 0, clicks: 0, shares: 0, watchPercentages: [] });
  }

  for (const ec of eventCounts) {
    if (!ec.videoId) continue;
    const stats = statsMap.get(ec.videoId);
    if (!stats) continue;

    switch (ec.type) {
      case "VIDEO_START": stats.views = ec._count.id; break;
      case "ADD_TO_CART": stats.carts = ec._count.id; break;
      case "SHOP_CLICK": stats.clicks = ec._count.id; break;
      case "SHARE": stats.shares = ec._count.id; break;
    }
  }

  for (const ev of completeEvents) {
    if (!ev.videoId) continue;
    const stats = statsMap.get(ev.videoId);
    if (!stats) continue;
    const meta = ev.metadata as { watchPercentage?: number } | null;
    if (meta?.watchPercentage != null) {
      stats.watchPercentages.push(Math.min(meta.watchPercentage, 1));
    }
  }

  // Compute scores and upsert
  const now = Date.now();
  const upserts = videos.map((video) => {
    const stats = statsMap.get(video.id)!;
    const views = stats.views || 1; // avoid division by zero

    const avgWatchPercent = stats.watchPercentages.length > 0
      ? stats.watchPercentages.reduce((a, b) => a + b, 0) / stats.watchPercentages.length
      : 0;
    const cartRate = Math.min(stats.carts / views, 1);
    const shopClickRate = Math.min(stats.clicks / views, 1);
    const shareRate = Math.min(stats.shares / views, 1);

    // Recency: exponential decay
    const daysOld = (now - video.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.exp(-daysOld / RECENCY_HALF_LIFE_DAYS);

    let score =
      WEIGHTS.watchCompletion * avgWatchPercent +
      WEIGHTS.cartRate * cartRate +
      WEIGHTS.shopClickRate * shopClickRate +
      WEIGHTS.shareRate * shareRate +
      WEIGHTS.recency * recencyBoost;

    // Cold start: if too few views, use a minimum score
    if (stats.views < COLD_START_THRESHOLD) {
      score = Math.max(score, COLD_START_SCORE);
    }

    return prisma.videoScore.upsert({
      where: { videoId: video.id },
      create: {
        videoId: video.id,
        avgWatchPercent,
        cartRate,
        shareRate,
        shopClickRate,
        totalViews: stats.views,
        score,
        computedAt: new Date(),
      },
      update: {
        avgWatchPercent,
        cartRate,
        shareRate,
        shopClickRate,
        totalViews: stats.views,
        score,
        computedAt: new Date(),
      },
    });
  });

  await prisma.$transaction(upserts);
}

/**
 * Check if scores need recomputation (older than 1 hour).
 */
export async function areScoresStale(): Promise<boolean> {
  const latest = await prisma.videoScore.findFirst({
    orderBy: { computedAt: "desc" },
    select: { computedAt: true },
  });

  if (!latest) return true;
  return Date.now() - latest.computedAt.getTime() > STALE_THRESHOLD_MS;
}

/**
 * Build a viewer interest profile from their recent events.
 * Returns a normalized tag weight map.
 */
export async function getViewerInterests(
  viewerSessionId: string
): Promise<Map<string, number>> {
  // Get recent videos the viewer interacted with
  const recentEvents = await prisma.event.findMany({
    where: {
      viewerSessionId,
      type: { in: ["VIDEO_START", "ADD_TO_CART"] },
      videoId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { videoId: true, type: true },
  });

  if (recentEvents.length === 0) return new Map();

  const videoIds = Array.from(new Set(recentEvents.filter((e) => e.videoId).map((e) => e.videoId!)));

  // Get products tagged on those videos
  const videoProducts = await prisma.videoProduct.findMany({
    where: { videoId: { in: videoIds } },
    include: {
      product: { select: { tags: true } },
    },
  });

  // Count tag frequencies (ADD_TO_CART events count double)
  const addToCartVideoIds = new Set(
    recentEvents.filter((e) => e.type === "ADD_TO_CART").map((e) => e.videoId!)
  );

  const tagCounts = new Map<string, number>();
  for (const vp of videoProducts) {
    if (!vp.product.tags) continue;
    const weight = addToCartVideoIds.has(vp.videoId) ? 2 : 1;
    const tags = vp.product.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + weight);
    }
  }

  // Normalize to 0-1
  const total = Array.from(tagCounts.values()).reduce((a, b) => a + b, 0);
  if (total === 0) return new Map();

  const normalized = new Map<string, number>();
  tagCounts.forEach((count, tag) => {
    normalized.set(tag, count / total);
  });

  return normalized;
}

/**
 * Calculate personalization boost for a video based on viewer interests.
 * Returns a multiplier between 1.0 (no boost) and 1.5 (max boost).
 */
export function calculatePersonalizationBoost(
  videoTags: string[],
  viewerInterests: Map<string, number>
): number {
  if (viewerInterests.size === 0 || videoTags.length === 0) return 1.0;

  let totalWeight = 0;
  let matchCount = 0;

  for (const tag of videoTags) {
    const weight = viewerInterests.get(tag.toLowerCase());
    if (weight != null) {
      totalWeight += weight;
      matchCount++;
    }
  }

  if (matchCount === 0) return 1.0;

  const avgMatch = totalWeight / matchCount;
  // Up to 50% boost for strongly matching content
  return 1 + avgMatch * 0.5;
}
