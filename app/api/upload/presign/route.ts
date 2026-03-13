import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDirectUploadUrl } from "@/lib/cloudflare";
import { canUploadVideo, PLAN_LIMITS, getUserPlan } from "@/lib/planLimits";
import { moderateTextContent } from "@/lib/moderation";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check upload limits
  const uploadCheck = await canUploadVideo(user.id);
  if (!uploadCheck.allowed) {
    return NextResponse.json(
      { error: uploadCheck.reason, remaining: uploadCheck.remaining },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { productIds, title, description, fileSizeMB } = body as {
    productIds?: string[];
    title?: string;
    description?: string;
    fileSizeMB?: number;
  };

  // Check file size limit
  if (fileSizeMB) {
    const plan = await getUserPlan(user.id);
    const limits = PLAN_LIMITS[plan];
    if (fileSizeMB > limits.maxFileSizeMB) {
      return NextResponse.json(
        { error: `File size exceeds ${limits.maxFileSizeMB}MB limit for your plan` },
        { status: 400 }
      );
    }
  }

  // Moderate title/description text
  if (title || description) {
    const textToCheck = [title, description].filter(Boolean).join(" ");
    const textModResult = await moderateTextContent(textToCheck);
    if (!textModResult.passed) {
      return NextResponse.json(
        { error: `Content rejected: ${textModResult.reason}` },
        { status: 400 }
      );
    }
  }

  const { uploadUrl, streamMediaId } = await createDirectUploadUrl();

  // Determine if video should be held for review (NEW trust level)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { trustLevel: true },
  });
  const shouldHoldForReview = dbUser?.trustLevel === "NEW";

  const video = await prisma.video.create({
    data: {
      userId: user.id,
      cloudflareStreamId: streamMediaId,
      status: "PROCESSING",
      title: title ?? null,
      description: description ?? null,
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

  return NextResponse.json({
    uploadUrl,
    videoId: video.id,
    heldForReview: shouldHoldForReview,
    remaining: uploadCheck.remaining,
  });
}
