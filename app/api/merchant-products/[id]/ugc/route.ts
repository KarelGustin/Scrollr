import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Find all VideoProduct records linking this merchant product to videos
  const videoProducts = await prisma.videoProduct.findMany({
    where: { merchantProductId: id },
    include: {
      video: {
        include: {
          user: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
          score: true,
        },
      },
    },
  });

  // Filter to only READY + published videos, then rank by score
  const scoredVideos = videoProducts
    .filter(
      (vp) =>
        vp.video.status === "READY" &&
        vp.video.published &&
        vp.video.hlsUrl
    )
    .map((vp) => ({
      id: vp.video.id,
      thumbnailUrl: vp.video.thumbnailUrl,
      hlsUrl: vp.video.hlsUrl,
      title: vp.video.title,
      user: {
        username: vp.video.user.username ?? "anonymous",
        avatarUrl: vp.video.user.avatarUrl,
      },
      score: vp.video.score?.score ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return NextResponse.json(scoredVideos);
}
