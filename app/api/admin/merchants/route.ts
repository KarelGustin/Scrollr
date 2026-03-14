import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 20;

  const [merchants, total] = await Promise.all([
    prisma.merchant.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { email: true, name: true } },
        _count: { select: { merchantProducts: true, orders: true } },
      },
    }),
    prisma.merchant.count(),
  ]);

  // Get revenue per merchant
  const merchantIds = merchants.map((m) => m.id);
  const revenueStats = await prisma.order.groupBy({
    by: ["merchantId"],
    where: { merchantId: { in: merchantIds } },
    _sum: { total: true },
  });
  const revenueMap = new Map(revenueStats.map((r) => [r.merchantId, r._sum.total ?? 0]));

  const merchantsWithStats = merchants.map((m) => ({
    ...m,
    totalRevenue: revenueMap.get(m.id) ?? 0,
  }));

  return NextResponse.json({ merchants: merchantsWithStats, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { userId, shopifyDomain, shopifyAccessToken, storeName, storeLogoUrl, shippingPolicy, returnPolicy } = body;

  if (!shopifyDomain) {
    return NextResponse.json({ error: "Shopify domain is required" }, { status: 400 });
  }

  let finalUserId = userId;

  // If no userId, create a new user automatically
  if (!finalUserId) {
    const username = (storeName || shopifyDomain.split(".")[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20) + Math.floor(Math.random() * 9999);
    const newUser = await prisma.user.create({
      data: {
        email: `${username}@merchant.scrollr.io`,
        username,
        name: storeName || shopifyDomain.split(".")[0],
        role: "CREATOR",
      },
    });
    finalUserId = newUser.id;
  }

  const merchant = await prisma.merchant.create({
    data: {
      userId: finalUserId,
      shopifyDomain,
      shopifyAccessToken: shopifyAccessToken || `tok_${Date.now()}`,
      storeName: storeName || null,
      storeLogoUrl: storeLogoUrl || null,
      shippingPolicy: shippingPolicy || null,
      returnPolicy: returnPolicy || null,
    },
  });

  return NextResponse.json(merchant, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { merchantId, storeName, storeLogoUrl, shippingPolicy, returnPolicy, active } = body;

  if (!merchantId) {
    return NextResponse.json({ error: "merchantId is required" }, { status: 400 });
  }

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      ...(storeName !== undefined && { storeName }),
      ...(storeLogoUrl !== undefined && { storeLogoUrl }),
      ...(shippingPolicy !== undefined && { shippingPolicy }),
      ...(returnPolicy !== undefined && { returnPolicy }),
      ...(active !== undefined && { active }),
    },
  });

  return NextResponse.json(merchant);
}
