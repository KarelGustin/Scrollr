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

  const { id: videoId } = await params;
  const body = await request.json();
  const { action, reason } = body as {
    action: "approve" | "reject" | "ban_user";
    reason?: string;
  };

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, userId: true },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "READY", published: true },
    });

    await prisma.moderationLog.create({
      data: {
        videoId,
        adminId: user.id,
        action: "APPROVED",
        reason,
      },
    });

    return NextResponse.json({ success: true, action: "approved" });
  }

  if (action === "reject") {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "REJECTED", published: false },
    });

    await prisma.moderationLog.create({
      data: {
        videoId,
        adminId: user.id,
        action: "REJECTED",
        reason,
      },
    });

    return NextResponse.json({ success: true, action: "rejected" });
  }

  if (action === "ban_user") {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "REJECTED", published: false },
    });

    const strikeResult = await applyStrike(video.userId);

    await prisma.moderationLog.create({
      data: {
        videoId,
        adminId: user.id,
        action: "USER_BANNED",
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      action: "user_banned",
      strike: strikeResult,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
