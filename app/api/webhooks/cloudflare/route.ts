import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCloudflareWebhook } from "@/lib/cloudflare";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("webhook-secret") ?? "";
  const bodyText = await req.text();

  if (!verifyCloudflareWebhook(bodyText, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(bodyText);
  const streamMediaId = payload.uid as string | undefined;

  if (!streamMediaId) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { cloudflareStreamId: streamMediaId },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const hlsUrl = payload.playback?.hls as string | undefined;
  const thumbnailUrl = payload.thumbnail as string | undefined;
  const duration = payload.duration as number | undefined;

  await prisma.video.update({
    where: { cloudflareStreamId: streamMediaId },
    data: {
      status: "READY",
      hlsUrl: hlsUrl ?? null,
      thumbnailUrl: thumbnailUrl ?? null,
      duration: duration ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
