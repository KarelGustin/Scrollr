import { prisma } from "./prisma";
import type { TimeRange, AnalyticsData } from "@/types";

function getDateRange(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function getAnalytics(
  userId: string,
  range: TimeRange
): Promise<AnalyticsData> {
  const since = getDateRange(range);

  const products = await prisma.product.findMany({
    where: { userId },
    select: { id: true, name: true },
  });

  const productIds = products.map((p) => p.id);

  const events = await prisma.event.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      type: { in: ["PAGE_VIEW", "VIDEO_START", "SHOP_CLICK"] },
    },
    select: { type: true, productId: true, createdAt: true },
  });

  const clicks = await prisma.click.findMany({
    where: {
      productId: { in: productIds },
      createdAt: { gte: since },
    },
    select: { productId: true, createdAt: true },
  });

  // Aggregate views by date
  const viewsByDate = new Map<string, number>();
  const clicksByDate = new Map<string, number>();

  for (const event of events) {
    const dateKey = event.createdAt.toISOString().split("T")[0];
    if (event.type === "PAGE_VIEW" || event.type === "VIDEO_START") {
      viewsByDate.set(dateKey, (viewsByDate.get(dateKey) ?? 0) + 1);
    }
  }

  for (const click of clicks) {
    const dateKey = click.createdAt.toISOString().split("T")[0];
    clicksByDate.set(dateKey, (clicksByDate.get(dateKey) ?? 0) + 1);
  }

  // Aggregate per product
  const productViews = new Map<string, number>();
  const productClicks = new Map<string, number>();

  for (const event of events) {
    if (event.productId && event.type === "VIDEO_START") {
      productViews.set(
        event.productId,
        (productViews.get(event.productId) ?? 0) + 1
      );
    }
  }

  for (const click of clicks) {
    productClicks.set(
      click.productId,
      (productClicks.get(click.productId) ?? 0) + 1
    );
  }

  return {
    views: Array.from(viewsByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    clicks: Array.from(clicksByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    products: products.map((p) => {
      const views = productViews.get(p.id) ?? 0;
      const pClicks = productClicks.get(p.id) ?? 0;
      return {
        id: p.id,
        name: p.name,
        views,
        clicks: pClicks,
        ctr: views > 0 ? Math.round((pClicks / views) * 10000) / 100 : 0,
      };
    }),
  };
}
