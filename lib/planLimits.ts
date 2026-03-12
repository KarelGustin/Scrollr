import type { Plan } from "@prisma/client";
import type { PlanLimits } from "@/types";
import { prisma } from "./prisma";

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { maxProducts: 5, analytics: 7, branding: true },
  CREATOR: { maxProducts: 999, analytics: 90, branding: false },
  PRO: { maxProducts: 999, analytics: 365, branding: false },
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
