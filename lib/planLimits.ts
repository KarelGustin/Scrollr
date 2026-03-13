import type { Plan } from "@prisma/client";
import type { PlanLimits } from "@/types";
import { prisma } from "./prisma";

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxProducts: 5,
    analytics: 7,
    branding: true,
    maxVideosPerDay: 3,
    maxVideosPerWeek: 10,
    maxDurationSeconds: 60,
    maxFileSizeMB: 100,
  },
  CREATOR: {
    maxProducts: 999,
    analytics: 90,
    branding: false,
    maxVideosPerDay: 10,
    maxVideosPerWeek: 50,
    maxDurationSeconds: 180,
    maxFileSizeMB: 500,
  },
  PRO: {
    maxProducts: 999,
    analytics: 365,
    branding: false,
    maxVideosPerDay: 25,
    maxVideosPerWeek: 100,
    maxDurationSeconds: 600,
    maxFileSizeMB: 2048,
  },
};

export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.status !== "active") {
    return "FREE";
  }

  return subscription.plan;
}

export async function canCreateProduct(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const count = await prisma.product.count({ where: { userId } });
  return count < PLAN_LIMITS[plan].maxProducts;
}

export function getAnalyticsDaysLimit(plan: Plan): number {
  return PLAN_LIMITS[plan].analytics;
}

export function showBranding(plan: Plan): boolean {
  return PLAN_LIMITS[plan].branding;
}

/**
 * Check if user can upload a new video based on plan limits and trust level.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export async function canUploadVideo(
  userId: string
): Promise<{ allowed: boolean; reason?: string; remaining?: { daily: number; weekly: number } }> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustLevel: true, bannedUntil: true, createdAt: true },
  });

  if (!user) return { allowed: false, reason: "User not found" };

  // Check if user is banned
  if (user.bannedUntil && user.bannedUntil > new Date()) {
    return { allowed: false, reason: `Upload ban until ${user.bannedUntil.toLocaleDateString()}` };
  }

  // Trust level overrides for new accounts
  let dailyLimit = limits.maxVideosPerDay;
  if (user.trustLevel === "NEW") {
    dailyLimit = 1; // New accounts: 1 video/day
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [dailyCount, weeklyCount] = await Promise.all([
    prisma.video.count({
      where: { userId, createdAt: { gte: dayAgo } },
    }),
    prisma.video.count({
      where: { userId, createdAt: { gte: weekAgo } },
    }),
  ]);

  if (dailyCount >= dailyLimit) {
    return { allowed: false, reason: "Daily upload limit reached", remaining: { daily: 0, weekly: Math.max(0, limits.maxVideosPerWeek - weeklyCount) } };
  }

  if (weeklyCount >= limits.maxVideosPerWeek) {
    return { allowed: false, reason: "Weekly upload limit reached", remaining: { daily: Math.max(0, dailyLimit - dailyCount), weekly: 0 } };
  }

  return {
    allowed: true,
    remaining: {
      daily: dailyLimit - dailyCount,
      weekly: limits.maxVideosPerWeek - weeklyCount,
    },
  };
}

/**
 * Get upload quota info for the dashboard display.
 */
export async function getUploadQuota(userId: string) {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustLevel: true },
  });

  const dailyLimit = user?.trustLevel === "NEW" ? 1 : limits.maxVideosPerDay;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [dailyUsed, weeklyUsed] = await Promise.all([
    prisma.video.count({
      where: { userId, createdAt: { gte: dayAgo } },
    }),
    prisma.video.count({
      where: { userId, createdAt: { gte: weekAgo } },
    }),
  ]);

  return {
    plan,
    daily: { used: dailyUsed, limit: dailyLimit },
    weekly: { used: weeklyUsed, limit: limits.maxVideosPerWeek },
    maxDurationSeconds: limits.maxDurationSeconds,
    maxFileSizeMB: limits.maxFileSizeMB,
  };
}

/**
 * Update user trust level based on account age and strike history.
 * Should be called periodically or on relevant events.
 */
export async function updateTrustLevel(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, strikeCount: true, trustLevel: true },
  });

  if (!user) return;

  const accountAgeMs = Date.now() - user.createdAt.getTime();
  const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

  let newTrust: "NEW" | "BASIC" | "ESTABLISHED" | "TRUSTED";

  if (user.strikeCount >= 3) {
    newTrust = "NEW"; // Demote on multiple strikes
  } else if (accountAgeDays >= 30 && user.strikeCount === 0) {
    newTrust = "TRUSTED";
  } else if (accountAgeDays >= 7) {
    newTrust = "ESTABLISHED";
  } else if (accountAgeDays >= 1) {
    newTrust = "BASIC";
  } else {
    newTrust = "NEW";
  }

  if (newTrust !== user.trustLevel) {
    await prisma.user.update({
      where: { id: userId },
      data: { trustLevel: newTrust },
    });
  }
}

/**
 * Apply a strike to a user and enforce consequences.
 */
export async function applyStrike(userId: string): Promise<{ strikeCount: number; action: string }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      strikeCount: { increment: 1 },
      lastStrikeAt: new Date(),
    },
    select: { strikeCount: true },
  });

  let action = "warning";
  const now = new Date();

  if (user.strikeCount >= 4) {
    // Permanent ban (set far future date)
    await prisma.user.update({
      where: { id: userId },
      data: { bannedUntil: new Date("2099-12-31") },
    });
    action = "permanent_ban";
  } else if (user.strikeCount === 3) {
    // 30-day upload ban
    await prisma.user.update({
      where: { id: userId },
      data: { bannedUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
    });
    action = "30_day_ban";
  } else if (user.strikeCount === 2) {
    // 7-day upload ban
    await prisma.user.update({
      where: { id: userId },
      data: { bannedUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
    });
    action = "7_day_ban";
  }

  await updateTrustLevel(userId);
  return { strikeCount: user.strikeCount, action };
}
