import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { areScoresStale, computeVideoScores } from "@/lib/recommendation";
import type { FeedVideo } from "@/types";

const FEED_VIDEO_INCLUDE = {
  user: {
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      heightCm: true,
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
          description: true,
          sizes: true,
          published: true,
          tags: true,
        },
      },
      merchantProduct: {
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          images: true,
          price: true,
          compareAtPrice: true,
          vendor: true,
          productUrl: true,
          inventoryQuantity: true,
          available: true,
          tags: true,
          productType: true,
        },
      },
    },
    orderBy: { position: "asc" as const },
  },
  score: true,
} as const;

type FeedVideoCandidate = Prisma.VideoGetPayload<{
  include: typeof FEED_VIDEO_INCLUDE;
}>;

type ViewerMode = "discovery" | "consideration" | "shopping" | "checkout_ready";

type ViewerProfile = {
  mode: ViewerMode;
  followedCreators: Set<string>;
  recentVideoIds: Set<string>;
  recentCreatorIds: Map<string, number>;
  creatorAffinity: Map<string, number>;
  brandAffinity: Map<string, number>;
  vendorAffinity: Map<string, number>;
  categoryAffinity: Map<string, number>;
  tagAffinity: Map<string, number>;
  sizeAffinity: Map<string, number>;
  cartCategoryAffinity: Map<string, number>;
  cartBrandAffinity: Map<string, number>;
  cartVendorAffinity: Map<string, number>;
  cartSizeAffinity: Map<string, number>;
  preferredPrice: {
    avg: number | null;
    min: number | null;
    max: number | null;
  };
};

type VideoSummary = {
  creatorId: string;
  categories: string[];
  brands: string[];
  vendors: string[];
  tags: string[];
  sizes: string[];
  averagePrice: number | null;
  availableCount: number;
  totalProducts: number;
  freshBoost: number;
};

const EVENT_SIGNAL_WEIGHTS: Record<string, number> = {
  PAGE_VIEW: 0.5,
  VIDEO_START: 1,
  VIDEO_COMPLETE: 1.6,
  SWIPE_NEXT: 0.15,
  SWIPE_PREV: 0.3,
  SHOP_CLICK: 3,
  ADD_TO_CART: 6,
  SHARE: 2.5,
};

const MODE_MULTIPLIERS: Record<
  ViewerMode,
  {
    affinity: number;
    priceFit: number;
    fit: number;
    cartContinuation: number;
    freshness: number;
  }
> = {
  discovery: {
    affinity: 0.85,
    priceFit: 0.5,
    fit: 0.6,
    cartContinuation: 0.15,
    freshness: 1,
  },
  consideration: {
    affinity: 1,
    priceFit: 0.8,
    fit: 0.9,
    cartContinuation: 0.4,
    freshness: 0.85,
  },
  shopping: {
    affinity: 1.1,
    priceFit: 1.1,
    fit: 1.15,
    cartContinuation: 1,
    freshness: 0.6,
  },
  checkout_ready: {
    affinity: 1.1,
    priceFit: 1.2,
    fit: 1.2,
    cartContinuation: 1.35,
    freshness: 0.45,
  },
};

function normalizeValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function parseTagList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => normalizeValue(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function parseSizes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? normalizeValue(entry) : null))
    .filter((entry): entry is string => Boolean(entry));
}

function increment(map: Map<string, number>, key: string | null, weight: number) {
  if (!key || weight === 0) return;
  map.set(key, (map.get(key) ?? 0) + weight);
}

function averageMapMatch(values: string[], affinity: Map<string, number>): number {
  if (values.length === 0 || affinity.size === 0) return 0;
  const scores = values
    .map((value) => affinity.get(value) ?? 0)
    .filter((value) => value > 0);
  if (scores.length === 0) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function preferredPriceScore(
  averagePrice: number | null,
  preferredPrice: ViewerProfile["preferredPrice"]
): number {
  if (averagePrice == null || preferredPrice.avg == null) return 0;

  const floor = preferredPrice.min ?? preferredPrice.avg;
  const ceiling = preferredPrice.max ?? preferredPrice.avg;

  if (averagePrice >= floor && averagePrice <= ceiling) {
    return 1;
  }

  const anchor = preferredPrice.avg || 1;
  const distanceRatio = Math.abs(averagePrice - anchor) / anchor;
  return Math.max(0, 1 - distanceRatio);
}

function stableJitter(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return ((hash % 1000) / 1000 - 0.5) * 2;
}

function summarizeVideo(video: FeedVideoCandidate): VideoSummary {
  const categories = new Set<string>();
  const brands = new Set<string>();
  const vendors = new Set<string>();
  const tags = new Set<string>();
  const sizes = new Set<string>();
  let priceTotal = 0;
  let priceCount = 0;
  let availableCount = 0;

  const videoCategory = normalizeValue(video.category);
  if (videoCategory) categories.add(videoCategory);

  for (const item of video.products) {
    const product = item.product;
    const merchantProduct = item.merchantProduct;
    const brand = normalizeValue(product?.brand);
    const vendor = normalizeValue(merchantProduct?.vendor);
    const merchantType = normalizeValue(merchantProduct?.productType);

    if (brand) brands.add(brand);
    if (vendor) vendors.add(vendor);
    if (merchantType) categories.add(merchantType);

    for (const tag of parseTagList(product?.tags)) tags.add(tag);
    for (const tag of parseTagList(merchantProduct?.tags)) tags.add(tag);
    for (const size of parseSizes(product?.sizes)) sizes.add(size);
    const creatorTaggedSize = normalizeValue(item.creatorTaggedSize);
    if (creatorTaggedSize) sizes.add(creatorTaggedSize);

    const price = merchantProduct?.price ?? product?.price ?? null;
    if (price != null) {
      priceTotal += price;
      priceCount += 1;
    }

    if ((merchantProduct?.available ?? product?.published ?? false) !== false) {
      availableCount += 1;
    }
  }

  const ageDays = (Date.now() - video.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const freshBoost = Math.max(0, 1 - ageDays / 21);

  return {
    creatorId: video.userId,
    categories: Array.from(categories),
    brands: Array.from(brands),
    vendors: Array.from(vendors),
    tags: Array.from(tags),
    sizes: Array.from(sizes),
    averagePrice: priceCount > 0 ? priceTotal / priceCount : null,
    availableCount,
    totalProducts: video.products.length,
    freshBoost,
  };
}

function ingestVideoSummary(
  summary: VideoSummary,
  weight: number,
  profile: ViewerProfile,
  options?: { markRecent?: boolean; videoId?: string }
) {
  increment(profile.creatorAffinity, summary.creatorId, weight * 1.25);
  for (const brand of summary.brands) increment(profile.brandAffinity, brand, weight);
  for (const vendor of summary.vendors) increment(profile.vendorAffinity, vendor, weight * 0.9);
  for (const category of summary.categories) increment(profile.categoryAffinity, category, weight);
  for (const tag of summary.tags) increment(profile.tagAffinity, tag, weight * 0.9);
  for (const size of summary.sizes) increment(profile.sizeAffinity, size, weight * 0.75);

  if (summary.averagePrice != null) {
    const currentAvg = profile.preferredPrice.avg;
    profile.preferredPrice.avg =
      currentAvg == null ? summary.averagePrice : (currentAvg + summary.averagePrice) / 2;
    profile.preferredPrice.min =
      profile.preferredPrice.min == null
        ? summary.averagePrice
        : Math.min(profile.preferredPrice.min, summary.averagePrice);
    profile.preferredPrice.max =
      profile.preferredPrice.max == null
        ? summary.averagePrice
        : Math.max(profile.preferredPrice.max, summary.averagePrice);
  }

  if (options?.markRecent) {
    increment(profile.recentCreatorIds, summary.creatorId, 1);
    if (options.videoId) profile.recentVideoIds.add(options.videoId);
  }
}

function buildEmptyProfile(): ViewerProfile {
  return {
    mode: "discovery",
    followedCreators: new Set<string>(),
    recentVideoIds: new Set<string>(),
    recentCreatorIds: new Map<string, number>(),
    creatorAffinity: new Map<string, number>(),
    brandAffinity: new Map<string, number>(),
    vendorAffinity: new Map<string, number>(),
    categoryAffinity: new Map<string, number>(),
    tagAffinity: new Map<string, number>(),
    sizeAffinity: new Map<string, number>(),
    cartCategoryAffinity: new Map<string, number>(),
    cartBrandAffinity: new Map<string, number>(),
    cartVendorAffinity: new Map<string, number>(),
    cartSizeAffinity: new Map<string, number>(),
    preferredPrice: {
      avg: null,
      min: null,
      max: null,
    },
  };
}

async function buildViewerProfile(viewerSessionId?: string | null, viewerUserId?: string | null) {
  const profile = buildEmptyProfile();
  const signalCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 45);

  const [sessionEvents, follows, savedItems, orders, cart] = await Promise.all([
    viewerSessionId
      ? prisma.event.findMany({
          where: {
            viewerSessionId,
            createdAt: { gte: signalCutoff },
            type: {
              in: [
                "VIDEO_START",
                "VIDEO_COMPLETE",
                "SHOP_CLICK",
                "ADD_TO_CART",
                "SHARE",
                "SWIPE_NEXT",
                "SWIPE_PREV",
              ],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 120,
          select: {
            type: true,
            createdAt: true,
            video: {
              include: FEED_VIDEO_INCLUDE,
            },
            product: {
              select: {
                id: true,
                userId: true,
                brand: true,
                price: true,
                tags: true,
                sizes: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    viewerUserId
      ? prisma.follow.findMany({
          where: { followerId: viewerUserId },
          select: { followingId: true },
        })
      : Promise.resolve([]),
    viewerUserId
      ? prisma.savedItem.findMany({
          where: { userId: viewerUserId },
          orderBy: { createdAt: "desc" },
          take: 60,
          select: {
            videoId: true,
            product: {
              select: {
                brand: true,
                price: true,
                tags: true,
                sizes: true,
              },
            },
            video: {
              include: FEED_VIDEO_INCLUDE,
            },
          },
        })
      : Promise.resolve([]),
    viewerUserId
      ? prisma.order.findMany({
          where: {
            buyerUserId: viewerUserId,
            status: { in: ["PAID", "FULFILLED", "SHIPPED", "DELIVERED"] },
          },
          orderBy: { createdAt: "desc" },
          take: 25,
          select: {
            createdAt: true,
            creatorId: true,
            items: {
              select: {
                merchantProduct: {
                  select: {
                    vendor: true,
                    price: true,
                    tags: true,
                    productType: true,
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
    viewerSessionId || viewerUserId
      ? prisma.cart.findFirst({
          where: {
            OR: [
              ...(viewerSessionId ? [{ sessionId: viewerSessionId }] : []),
              ...(viewerUserId ? [{ userId: viewerUserId }] : []),
            ],
          },
          orderBy: { updatedAt: "desc" },
          select: {
            updatedAt: true,
            items: {
              select: {
                selectedSize: true,
                product: {
                  select: {
                    brand: true,
                    price: true,
                    tags: true,
                    sizes: true,
                  },
                },
                merchantProduct: {
                  select: {
                    vendor: true,
                    price: true,
                    tags: true,
                    productType: true,
                  },
                },
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  for (const follow of follows) {
    profile.followedCreators.add(follow.followingId);
    increment(profile.creatorAffinity, follow.followingId, 5);
  }

  for (const event of sessionEvents) {
    const weight = EVENT_SIGNAL_WEIGHTS[event.type] ?? 0;
    const video = event.video;
    if (video) {
      ingestVideoSummary(summarizeVideo(video), weight, profile, {
        markRecent: true,
        videoId: video.id,
      });
      continue;
    }

    if (event.product) {
      increment(profile.brandAffinity, normalizeValue(event.product.brand), weight);
      for (const tag of parseTagList(event.product.tags)) increment(profile.tagAffinity, tag, weight);
      for (const size of parseSizes(event.product.sizes)) increment(profile.sizeAffinity, size, weight * 0.75);
      if (event.product.price != null) {
        profile.preferredPrice.avg =
          profile.preferredPrice.avg == null
            ? event.product.price
            : (profile.preferredPrice.avg + event.product.price) / 2;
      }
    }
  }

  for (const item of savedItems) {
    if (item.video) {
      ingestVideoSummary(summarizeVideo(item.video), 4, profile);
    }
    if (item.product) {
      increment(profile.brandAffinity, normalizeValue(item.product.brand), 3.5);
      for (const tag of parseTagList(item.product.tags)) increment(profile.tagAffinity, tag, 3);
      for (const size of parseSizes(item.product.sizes)) increment(profile.sizeAffinity, size, 2);
      if (item.product.price != null) {
        profile.preferredPrice.avg =
          profile.preferredPrice.avg == null
            ? item.product.price
            : (profile.preferredPrice.avg + item.product.price) / 2;
      }
    }
  }

  for (const order of orders) {
    increment(profile.creatorAffinity, order.creatorId, 7);
    for (const item of order.items) {
      const merchantProduct = item.merchantProduct;
      increment(profile.vendorAffinity, normalizeValue(merchantProduct?.vendor), 5);
      increment(profile.categoryAffinity, normalizeValue(merchantProduct?.productType), 4);
      for (const tag of parseTagList(merchantProduct?.tags)) increment(profile.tagAffinity, tag, 4.5);
      if (merchantProduct?.price != null) {
        profile.preferredPrice.avg =
          profile.preferredPrice.avg == null
            ? merchantProduct.price
            : (profile.preferredPrice.avg + merchantProduct.price) / 2;
        profile.preferredPrice.min =
          profile.preferredPrice.min == null
            ? merchantProduct.price
            : Math.min(profile.preferredPrice.min, merchantProduct.price);
        profile.preferredPrice.max =
          profile.preferredPrice.max == null
            ? merchantProduct.price
            : Math.max(profile.preferredPrice.max, merchantProduct.price);
      }
    }
  }

  if (cart) {
    for (const item of cart.items) {
      const productBrand = normalizeValue(item.product?.brand);
      const merchantVendor = normalizeValue(item.merchantProduct?.vendor);
      const merchantType = normalizeValue(item.merchantProduct?.productType);

      increment(profile.cartBrandAffinity, productBrand, 1);
      increment(profile.cartVendorAffinity, merchantVendor, 1);
      increment(profile.cartCategoryAffinity, merchantType, 1);
      increment(profile.cartSizeAffinity, normalizeValue(item.selectedSize), 1);

      for (const tag of parseTagList(item.product?.tags)) increment(profile.cartCategoryAffinity, tag, 0.5);
      for (const tag of parseTagList(item.merchantProduct?.tags)) increment(profile.cartCategoryAffinity, tag, 0.5);
      for (const size of parseSizes(item.product?.sizes)) increment(profile.sizeAffinity, size, 1.5);
    }
  }

  const recentAddToCart = sessionEvents.some(
    (event) => event.type === "ADD_TO_CART" && Date.now() - event.createdAt.getTime() < 1000 * 60 * 60 * 24 * 3
  );
  const recentShopClick = sessionEvents.some(
    (event) => event.type === "SHOP_CLICK" && Date.now() - event.createdAt.getTime() < 1000 * 60 * 60 * 24 * 3
  );
  const hasActiveCart = Boolean(cart && cart.items.length > 0);

  if (hasActiveCart && recentAddToCart) {
    profile.mode = "checkout_ready";
  } else if (hasActiveCart || recentAddToCart) {
    profile.mode = "shopping";
  } else if (recentShopClick || savedItems.length > 0) {
    profile.mode = "consideration";
  }

  return profile;
}

function scoreVideoForViewer(
  video: FeedVideoCandidate,
  profile: ViewerProfile,
  viewerSeed: string
): number {
  const summary = summarizeVideo(video);
  const modeWeights = MODE_MULTIPLIERS[profile.mode];
  const baseQuality = (video.score?.score ?? 0.5) * 40;
  const creatorAffinity = (profile.creatorAffinity.get(summary.creatorId) ?? 0) * 2.6;
  const followBoost = profile.followedCreators.has(summary.creatorId) ? 14 : 0;
  const brandMatch = averageMapMatch(summary.brands, profile.brandAffinity) * 16;
  const vendorMatch = averageMapMatch(summary.vendors, profile.vendorAffinity) * 13;
  const categoryMatch = averageMapMatch(summary.categories, profile.categoryAffinity) * 13;
  const tagMatch = averageMapMatch(summary.tags, profile.tagAffinity) * 12;
  const sizeMatch = averageMapMatch(summary.sizes, profile.sizeAffinity) * 10;
  const priceFit = preferredPriceScore(summary.averagePrice, profile.preferredPrice) * 11;
  const cartContinuation =
    averageMapMatch(summary.categories, profile.cartCategoryAffinity) * 9 +
    averageMapMatch(summary.brands, profile.cartBrandAffinity) * 8 +
    averageMapMatch(summary.vendors, profile.cartVendorAffinity) * 8 +
    averageMapMatch(summary.sizes, profile.cartSizeAffinity) * 7;
  const availabilityBoost =
    summary.availableCount === 0 ? -24 : Math.min(8, summary.availableCount * 2.25);
  const freshnessBoost = summary.freshBoost * 6;
  const recentPenalty = profile.recentVideoIds.has(video.id) ? -26 : 0;
  const creatorRepetitionPenalty = -Math.min(10, (profile.recentCreatorIds.get(summary.creatorId) ?? 0) * 2.5);
  const explorationBoost = stableJitter(`${viewerSeed}:${video.id}`) * 2.2;

  return (
    baseQuality +
    (creatorAffinity + followBoost + brandMatch + vendorMatch + categoryMatch + tagMatch) * modeWeights.affinity +
    priceFit * modeWeights.priceFit +
    sizeMatch * modeWeights.fit +
    cartContinuation * modeWeights.cartContinuation +
    freshnessBoost * modeWeights.freshness +
    availabilityBoost +
    recentPenalty +
    creatorRepetitionPenalty +
    explorationBoost
  );
}

function mapVideoToFeedVideo(video: FeedVideoCandidate): FeedVideo {
  return {
    id: video.id,
    hlsUrl: video.hlsUrl!,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    user: {
      id: video.user.id,
      username: video.user.username ?? "anonymous",
      name: video.user.name,
      avatarUrl: video.user.avatarUrl,
      heightCm: video.user.heightCm,
    },
    products: video.products
      .filter((item) =>
        item.product ? item.product.published : item.merchantProduct?.available
      )
      .map((item) => {
        const merchantProduct = item.merchantProduct;
        const product = item.product;
        const merchantPrice = merchantProduct?.price ?? null;
        const merchantImages = (merchantProduct?.images as string[] | null) ?? null;

        return {
          id: product?.id ?? merchantProduct?.id ?? item.id,
          name: merchantProduct?.title ?? product?.name ?? "Unknown",
          brand: product?.brand ?? null,
          price: merchantPrice ?? product?.price ?? null,
          priceDisplay:
            merchantPrice != null
              ? formatPrice(merchantPrice)
              : (product?.priceDisplay ?? null),
          imageUrl: merchantProduct?.imageUrl ?? product?.imageUrl ?? null,
          images: merchantImages,
          affiliateUrl: product?.affiliateUrl ?? merchantProduct?.productUrl ?? "",
          description: merchantProduct?.description ?? product?.description ?? null,
          sizes: (product?.sizes as string[] | null) ?? null,
          merchantProductId: merchantProduct?.id ?? null,
          merchantUrl: merchantProduct?.productUrl ?? null,
          vendor: merchantProduct?.vendor ?? null,
          inventoryQuantity: merchantProduct?.inventoryQuantity ?? null,
          compareAtPrice: merchantProduct?.compareAtPrice ?? null,
          variants: null,
          creatorTaggedSize: item.creatorTaggedSize ?? null,
          creatorHeightCm: video.user.heightCm ?? null,
        };
      }),
  };
}

export async function getRankedFeedPage(options: {
  viewerSessionId?: string | null;
  viewerUserId?: string | null;
  limit?: number;
  cursor?: string | null;
  category?: string | null;
}) {
  const limit = Math.min(options.limit ?? 10, 50);
  const stale = await areScoresStale();
  if (stale) {
    await computeVideoScores();
  }

  const category = normalizeValue(options.category);
  const [profile, videos] = await Promise.all([
    buildViewerProfile(options.viewerSessionId, options.viewerUserId),
    prisma.video.findMany({
      where: {
        status: "READY",
        published: true,
        hlsUrl: { not: null },
        products: {
          some: category
            ? {
                OR: [
                  {
                    product: {
                      published: true,
                      tags: { contains: category, mode: "insensitive" },
                    },
                  },
                  {
                    merchantProduct: {
                      available: true,
                      OR: [
                        { tags: { contains: category, mode: "insensitive" } },
                        { productType: { contains: category, mode: "insensitive" } },
                      ],
                    },
                  },
                ],
              }
            : {},
        },
      },
      include: FEED_VIDEO_INCLUDE,
      take: category ? 120 : 160,
    }),
  ]);

  const viewerSeed = options.viewerUserId ?? options.viewerSessionId ?? "anonymous";
  const ranked = videos
    .map((video) => ({
      video,
      score: scoreVideoForViewer(video, profile, viewerSeed),
    }))
    .sort((left, right) => right.score - left.score);

  let startIndex = 0;
  if (options.cursor) {
    const cursorIndex = ranked.findIndex((entry) => entry.video.id === options.cursor);
    if (cursorIndex >= 0) startIndex = cursorIndex + 1;
  }

  const page = ranked.slice(startIndex, startIndex + limit + 1);
  const hasMore = page.length > limit;
  const items = hasMore ? page.slice(0, limit) : page;
  const nextCursor = hasMore ? items[items.length - 1].video.id : null;

  return {
    items: items.map((entry) => mapVideoToFeedVideo(entry.video)),
    nextCursor,
    mode: profile.mode,
  };
}

export async function getRankedFeedVideos(options: {
  viewerSessionId?: string | null;
  viewerUserId?: string | null;
  limit?: number;
  category?: string | null;
}) {
  const result = await getRankedFeedPage({
    viewerSessionId: options.viewerSessionId,
    viewerUserId: options.viewerUserId,
    limit: options.limit ?? 30,
    category: options.category,
  });

  return result.items;
}
