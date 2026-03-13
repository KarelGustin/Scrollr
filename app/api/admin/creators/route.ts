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

  const creators = await prisma.user.findMany({
    where: { role: "CREATOR" },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      bannedUntil: true,
      _count: { select: { videos: true, products: true } },
    },
  });

  // Get commission/order stats per creator
  const creatorIds = creators.map((c) => c.id);

  const [commissionStats, orderStats, total] = await Promise.all([
    prisma.commission.groupBy({
      by: ["userId"],
      where: { userId: { in: creatorIds }, type: "CREATOR_SALE" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["creatorId"],
      where: { creatorId: { in: creatorIds } },
      _sum: { total: true, platformFee: true },
      _count: true,
    }),
    prisma.user.count({ where: { role: "CREATOR" } }),
  ]);

  const commissionMap = new Map(commissionStats.map((c) => [c.userId, c]));
  const orderMap = new Map(orderStats.map((o) => [o.creatorId, o]));

  const creatorsWithStats = creators.map((creator) => {
    const commission = commissionMap.get(creator.id);
    const orders = orderMap.get(creator.id);
    return {
      ...creator,
      totalEarnings: commission?._sum.amount ?? 0,
      totalSales: orders?._count ?? 0,
      totalRevenue: orders?._sum.total ?? 0,
      scrollrEarnings: orders?._sum.platformFee ?? 0,
    };
  });

  return NextResponse.json({ creators: creatorsWithStats, total, page, pageSize });
}
