import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDirectUploadUrl } from "@/lib/cloudflare";
import { canCreateProduct } from "@/lib/planLimits";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await canCreateProduct(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Product limit reached for your plan" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { productId } = body;

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  // Verify product ownership
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { userId: true },
  });

  if (!product || product.userId !== session.user.id) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { uploadUrl, streamMediaId } = await createDirectUploadUrl();

  const video = await prisma.video.create({
    data: {
      productId,
      cloudflareStreamId: streamMediaId,
      status: "PROCESSING",
    },
  });

  return NextResponse.json({ uploadUrl, videoId: video.id });
}
