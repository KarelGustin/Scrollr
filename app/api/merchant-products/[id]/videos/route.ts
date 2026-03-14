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

  // Filter to only READY + published videos with hlsUrl, then rank
  const scoredVideos = videoProducts
    .filter(
      (vp) =>
        vp.video.status === "READY" &&
        vp.video.published &&
        vp.video.hlsUrl
    )
    .map((vp) => {
      const video = vp.video;
      const score = video.score;

      // Calculate performance score using Wilson score-like approach
      const cartRate = score?.cartRate ?? 0;
      const shopClickRate = score?.shopClickRate ?? 0;
      const totalViews = score?.totalViews ?? 0;

      // Conversion signal: weighted combination of cart and shop click rates
      const conversionSignal = cartRate * 0.6 + shopClickRate * 0.4;

      // View confidence: logarithmic scale 0-1 (1000 views = ~1.0)
      const viewConfidence =
        Math.log10(Math.max(totalViews, 1) + 1) / Math.log10(1001);

      // Combined performance score
      const performanceScore = conversionSignal * 0.6 + viewConfidence * 0.4;

      return {
        id: video.id,
        thumbnailUrl: video.thumbnailUrl,
        hlsUrl: video.hlsUrl,
        duration: video.duration,
        performanceScore: Math.round(performanceScore * 1000) / 1000,
        totalViews,
        user: {
          username: video.user.username ?? "anonymous",
          avatarUrl: video.user.avatarUrl,
        },
      };
    })
    // Sort by performance score descending
    .sort((a, b) => b.performanceScore - a.performanceScore)
    // Return top 10
    .slice(0, 10);

  return NextResponse.json(scoredVideos);
}
