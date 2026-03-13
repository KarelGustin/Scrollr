import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyStrike } from "@/lib/planLimits";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: reportId } = await params;
  const body = await request.json();
  const { action } = body as {
    action: "dismiss" | "remove_video" | "warn_user" | "ban_user";
  };

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      video: {
        select: { id: true, userId: true },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (action === "dismiss") {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "DISMISSED" },
    });

    return NextResponse.json({ success: true, action: "dismissed" });
  }

  if (action === "remove_video") {
    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: { status: "REVIEWED" },
      }),
      prisma.video.update({
        where: { id: report.videoId },
        data: { published: false, status: "REJECTED" },
      }),
      prisma.moderationLog.create({
        data: {
          videoId: report.videoId,
          adminId: user.id,
          action: "REJECTED",
          reason: `Removed via report #${reportId}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, action: "video_removed" });
  }

  if (action === "warn_user") {
    const strikeResult = await applyStrike(report.video.userId);

    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: { status: "REVIEWED" },
      }),
      prisma.moderationLog.create({
        data: {
          videoId: report.videoId,
          adminId: user.id,
          action: "USER_WARNED",
          reason: `Warning via report #${reportId}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      action: "user_warned",
      strike: strikeResult,
    });
  }

  if (action === "ban_user") {
    const strikeResult = await applyStrike(report.video.userId);

    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: { status: "REVIEWED" },
      }),
      prisma.video.update({
        where: { id: report.videoId },
        data: { published: false, status: "REJECTED" },
      }),
      prisma.moderationLog.create({
        data: {
          videoId: report.videoId,
          adminId: user.id,
          action: "USER_BANNED",
          reason: `Banned via report #${reportId}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      action: "user_banned",
      strike: strikeResult,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
