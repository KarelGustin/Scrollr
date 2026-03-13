import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moderateVideo } from "@/lib/moderation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify video belongs to user
  const video = await prisma.video.findUnique({
    where: { id, userId: user.id },
    select: { id: true, status: true },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.status !== "READY" && video.status !== "PROCESSING") {
    return NextResponse.json(
      { error: "Video is not in a moderatable state" },
      { status: 400 }
    );
  }

  const result = await moderateVideo(id);

  return NextResponse.json({
    videoId: id,
    passed: result.passed,
    reason: result.reason ?? null,
    category: result.category ?? null,
  });
}
