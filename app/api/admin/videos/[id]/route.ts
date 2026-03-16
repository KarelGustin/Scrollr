import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const user = await getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") return null;
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const video = await prisma.video.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      title: true,
      hlsUrl: true,
      thumbnailUrl: true,
      duration: true,
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(video);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const video = await prisma.video.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, userId: true, cloudflareStreamId: true },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  try {
    // Log the deletion
    await prisma.moderationLog.create({
      data: {
        videoId: video.id,
        adminId: admin.id,
        action: "REJECTED",
        reason: "Deleted by admin",
      },
    });

    // Delete video (cascade handles video products, events, reports, etc.)
    await prisma.video.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      action: "video_deleted",
      deletedVideo: { id: video.id, title: video.title },
    });
  } catch (error) {
    console.error("Failed to delete video:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
