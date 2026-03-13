import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_REASONS = [
  "SEXUAL_CONTENT",
  "VIOLENCE",
  "HATE_SPEECH",
  "SPAM",
  "SCAM",
  "INVOLVES_MINOR",
  "COPYRIGHT",
  "SELF_HARM",
  "OTHER",
] as const;

const AUTO_HIDE_THRESHOLD = 3;
const MAX_REPORTS_PER_DAY = 10;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videoId = params.id;
  const body = await req.json();
  const { reason, details } = body as { reason: string; details?: string };

  if (!VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
    return NextResponse.json({ error: "Invalid report reason" }, { status: 400 });
  }

  // Check reporter cooldown
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentReports = await prisma.report.count({
    where: { reporterId: user.id, createdAt: { gte: dayAgo } },
  });

  if (recentReports >= MAX_REPORTS_PER_DAY) {
    return NextResponse.json(
      { error: "Report limit reached. Max 10 reports per day." },
      { status: 429 }
    );
  }

  // Check if video exists
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, userId: true },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Can't report your own video
  if (video.userId === user.id) {
    return NextResponse.json({ error: "Cannot report your own video" }, { status: 400 });
  }

  // Create or update report (unique per video+reporter)
  const report = await prisma.report.upsert({
    where: {
      videoId_reporterId: { videoId, reporterId: user.id },
    },
    create: {
      videoId,
      reporterId: user.id,
      reason: reason as (typeof VALID_REASONS)[number],
      details: details?.slice(0, 500) ?? null,
    },
    update: {
      reason: reason as (typeof VALID_REASONS)[number],
      details: details?.slice(0, 500) ?? null,
      status: "PENDING",
    },
  });

  // Auto-hide if threshold reached
  const totalReports = await prisma.report.count({
    where: { videoId, status: "PENDING" },
  });

  if (totalReports >= AUTO_HIDE_THRESHOLD) {
    await prisma.video.update({
      where: { id: videoId },
      data: { published: false, status: "PENDING_REVIEW" },
    });
  }

  return NextResponse.json({ id: report.id, autoHidden: totalReports >= AUTO_HIDE_THRESHOLD });
}
