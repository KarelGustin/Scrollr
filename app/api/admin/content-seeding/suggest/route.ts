import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchProducts } from "@/lib/product-matcher";

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

  const { videoId, merchantId } = await request.json();

  if (!videoId || !merchantId) {
    return NextResponse.json({ error: "videoId and merchantId required" }, { status: 400 });
  }

  const [video, products] = await Promise.all([
    prisma.video.findUnique({
      where: { id: videoId },
      select: { title: true, description: true, category: true },
    }),
    prisma.merchantProduct.findMany({
      where: { merchantId, available: true },
      select: { id: true, title: true, tags: true, productType: true, vendor: true },
    }),
  ]);

  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const suggestions = matchProducts(video, products);

  return NextResponse.json({ suggestions });
}
