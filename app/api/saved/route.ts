import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const saved = await prisma.savedItem.findMany({
    where: { userId: user.id },
    include: {
      video: {
        select: {
          id: true,
          thumbnailUrl: true,
          title: true,
          hlsUrl: true,
          user: { select: { username: true, name: true, avatarUrl: true } },
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          brand: true,
          price: true,
          priceDisplay: true,
          imageUrl: true,
          affiliateUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(saved);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { videoId, productId } = await request.json();
  if (!videoId && !productId) return NextResponse.json({ error: "Provide videoId or productId" }, { status: 400 });

  if (videoId) {
    await prisma.savedItem.upsert({
      where: { userId_videoId: { userId: user.id, videoId } },
      create: { userId: user.id, videoId },
      update: {},
    });
  }

  if (productId) {
    await prisma.savedItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { videoId, productId } = await request.json();

  if (videoId) {
    await prisma.savedItem.deleteMany({ where: { userId: user.id, videoId } });
  }
  if (productId) {
    await prisma.savedItem.deleteMany({ where: { userId: user.id, productId } });
  }

  return NextResponse.json({ success: true });
}
