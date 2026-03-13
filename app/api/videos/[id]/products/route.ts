import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Add/replace products on a video
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!video || video.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { productIds } = body as { productIds: string[] };

  if (!Array.isArray(productIds)) {
    return NextResponse.json(
      { error: "productIds must be an array" },
      { status: 400 }
    );
  }

  if (productIds.length > 7) {
    return NextResponse.json(
      { error: "Maximum 7 products per video" },
      { status: 400 }
    );
  }

  // Verify all products belong to this user
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, userId: user.id },
    select: { id: true },
  });

  const validIds = new Set(products.map((p) => p.id));
  const filteredIds = productIds.filter((id) => validIds.has(id));

  // Replace all video-product links
  await prisma.$transaction([
    prisma.videoProduct.deleteMany({ where: { videoId: id } }),
    prisma.videoProduct.createMany({
      data: filteredIds.map((productId, index) => ({
        videoId: id,
        productId,
        position: index,
      })),
    }),
  ]);

  const updated = await prisma.video.findUnique({
    where: { id },
    include: {
      products: {
        include: { product: true },
        orderBy: { position: "asc" },
      },
    },
  });

  return NextResponse.json(updated);
}
