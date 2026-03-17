import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDirectUploadUrl } from "@/lib/cloudflare";
import { canUploadVideo, CREATOR_LIMITS } from "@/lib/planLimits";
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
  const { productIds, merchantProductIds, taggedMerchantProducts, title, description, location, fileSizeMB } = body as {
    productIds?: string[];
    merchantProductIds?: string[];
    taggedMerchantProducts?: { merchantProductId: string; creatorTaggedSize?: string | null }[];
    title?: string;
    description?: string;
    location?: string;
    fileSizeMB?: number;
  };

  // Check file size limit
  if (fileSizeMB) {
    if (fileSizeMB > CREATOR_LIMITS.maxFileSizeMB) {
      return NextResponse.json(
        { error: `File size exceeds ${CREATOR_LIMITS.maxFileSizeMB}MB limit` },
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
      location: location ?? null,
    },
  });

  // If legacy product IDs were provided, link them to the video
  if (productIds && productIds.length > 0) {
    await prisma.videoProduct.createMany({
      data: productIds.map((productId, index) => ({
        videoId: video.id,
        productId,
        position: index,
      })),
    });
  }

  // If merchant product IDs were provided, link them to the video
  const merchantProductsToCreate: {
    merchantProductId: string;
    creatorTaggedSize?: string | null;
  }[] =
    taggedMerchantProducts && taggedMerchantProducts.length > 0
      ? taggedMerchantProducts
      : merchantProductIds?.map((merchantProductId) => ({ merchantProductId })) ?? [];

  if (merchantProductsToCreate.length > 0) {
    const startPosition = productIds?.length ?? 0;
    await prisma.videoProduct.createMany({
      data: merchantProductsToCreate.map((product, index) => ({
        videoId: video.id,
        merchantProductId: product.merchantProductId,
        creatorTaggedSize: product.creatorTaggedSize?.trim() || null,
        position: startPosition + index,
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
