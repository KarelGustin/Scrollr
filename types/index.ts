import type { Product, Video, Event, Subscription, Plan } from "@prisma/client";

export type ProductWithVideo = Product & {
  video: Video | null;
};

export type ProductWithStats = Product & {
  video: Video | null;
  views: number;
  clicks: number;
  ctr: number;
};

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
