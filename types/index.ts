import type { Product, Video, Event, Subscription, Plan } from "@prisma/client";

export type ProductWithVideos = Product & {
  videos: { video: Video }[];
};

export type ProductWithVideo = Product & {
  video: Video | null;
};

export type ProductWithStats = Product & {
  views: number;
  clicks: number;
  ctr: number;
};

// Feed types — video-first model
export type FeedVideo = {
  id: string;
  hlsUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  user: {
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  products: FeedVideoProduct[];
};

export type FeedVideoProduct = {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  priceDisplay: string | null;
  imageUrl: string | null;
  affiliateUrl: string;
};

// Legacy compat — kept for existing code that may reference it
export type FeedProduct = {
  id: string;
  name: string;
  brand: string | null;
  price: string | null;
  description: string | null;
  video: {
    hlsUrl: string;
    thumbnailUrl: string | null;
    duration: number | null;
  };
};

export type AnalyticsData = {
  views: { date: string; count: number }[];
  clicks: { date: string; count: number }[];
  products: {
    id: string;
    name: string;
    views: number;
    clicks: number;
    ctr: number;
  }[];
};

export type TimeRange = "24h" | "7d" | "30d";

export type EventPayload = {
  type: Event["type"];
  videoId?: string;
  productId?: string;
  metadata?: Record<string, unknown>;
};

export type UserProfile = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export type SubscriptionInfo = Subscription & {
  plan: Plan;
};

export type PlanLimits = {
  maxProducts: number;
  analytics: number;
  branding: boolean;
};

export type CartItemWithProduct = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    brand: string | null;
    price: number | null;
    priceDisplay: string | null;
    imageUrl: string | null;
    affiliateUrl: string;
    user: {
      id: string;
      username: string | null;
      name: string | null;
    };
  };
};
