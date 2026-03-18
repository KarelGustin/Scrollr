import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCloudflareWebhook } from "@/lib/cloudflare";
import {
  markWebhookEventFailure,
  markWebhookEventSuccess,
  startWebhookEvent,
} from "@/lib/webhook-idempotency";

export async function POST(req: NextRequest) {
  const bodyText = await req.text();

  if (!verifyCloudflareWebhook(bodyText, req.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const streamMediaId = payload.uid as string | undefined;
  const eventType = (payload.type as string | undefined) ?? "unknown";
  const eventIdHeader =
    req.headers.get("webhook-id") ??
    req.headers.get("cf-webhook-id") ??
    req.headers.get("x-request-id");
  const dedupeKey = eventIdHeader ?? `${streamMediaId ?? "unknown"}:${eventType}`;

  const guard = await startWebhookEvent("CLOUDFLARE", dedupeKey);
  if (!guard.shouldProcess) {
    return NextResponse.json({ success: true, deduplicated: true });
  }

  if (!streamMediaId) {
    await markWebhookEventFailure(guard.recordId, "Missing uid");
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  try {
    const video = await prisma.video.findUnique({
      where: { cloudflareStreamId: streamMediaId },
    });

    if (!video) {
      await markWebhookEventFailure(guard.recordId, "Video not found");
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const playback = payload.playback as { hls?: string } | undefined;
    const hlsUrl = playback?.hls;
    const thumbnailUrl = payload.thumbnail as string | undefined;
    const duration = payload.duration as number | undefined;

    // Check if this video's creator should be held for review
    const creator = await prisma.user.findUnique({
      where: { id: video.userId },
      select: { trustLevel: true },
    });
    const shouldPublish = creator?.trustLevel !== "NEW";

    await prisma.video.update({
      where: { cloudflareStreamId: streamMediaId },
      data: {
        status: shouldPublish ? "READY" : "PENDING_REVIEW",
        published: shouldPublish,
        hlsUrl: hlsUrl ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        duration: duration ?? null,
      },
    });
  } catch (error) {
    await markWebhookEventFailure(
      guard.recordId,
      error instanceof Error ? error.message : "Cloudflare webhook failed"
    );
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  await markWebhookEventSuccess(guard.recordId);
  return NextResponse.json({ success: true });
}
