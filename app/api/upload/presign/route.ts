import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDirectUploadUrl } from "@/lib/cloudflare";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { productIds } = body as { productIds?: string[] };

  const { uploadUrl, streamMediaId } = await createDirectUploadUrl();

  const video = await prisma.video.create({
    data: {
      userId: user.id,
      cloudflareStreamId: streamMediaId,
      status: "PROCESSING",
    },
  });

  // If product IDs were provided, link them to the video
  if (productIds && productIds.length > 0) {
    await prisma.videoProduct.createMany({
      data: productIds.map((productId, index) => ({
        videoId: video.id,
        productId,
        position: index,
      })),
    });
  }

  return NextResponse.json({ uploadUrl, videoId: video.id });
}
