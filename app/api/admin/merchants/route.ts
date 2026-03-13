import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { userId, shopifyDomain, shopifyAccessToken, storeName } = body;

  if (!userId || !shopifyDomain || !shopifyAccessToken) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const merchant = await prisma.merchant.create({
    data: { userId, shopifyDomain, shopifyAccessToken, storeName },
  });

  return NextResponse.json(merchant, { status: 201 });
}
