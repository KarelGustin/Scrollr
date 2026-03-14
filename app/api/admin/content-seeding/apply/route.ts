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

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { videoId, merchantProductIds } = await request.json();

  if (!videoId || !Array.isArray(merchantProductIds) || merchantProductIds.length === 0) {
    return NextResponse.json({ error: "videoId and merchantProductIds[] required" }, { status: 400 });
  }

  // Get existing tags to avoid duplicates
  const existing = await prisma.videoProduct.findMany({
    where: { videoId, merchantProductId: { in: merchantProductIds } },
    select: { merchantProductId: true },
  });
  const existingIds = new Set(existing.map((e) => e.merchantProductId));

  const newIds = merchantProductIds.filter((id: string) => !existingIds.has(id));

  if (newIds.length === 0) {
    return NextResponse.json({ created: 0, message: "All products already tagged" });
  }

  // Get max position
  const maxPos = await prisma.videoProduct.aggregate({
    where: { videoId },
    _max: { position: true },
  });
  let pos = (maxPos._max.position ?? -1) + 1;

  const created = await Promise.all(
    newIds.map((merchantProductId: string) =>
      prisma.videoProduct.create({
        data: {
          videoId,
          merchantProductId,
          position: pos++,
        },
      })
    )
  );

  return NextResponse.json({ created: created.length });
}
