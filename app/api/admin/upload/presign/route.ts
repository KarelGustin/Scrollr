import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDirectUploadUrl } from "@/lib/cloudflare";

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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { creatorId, title, description, category } = body as {
    creatorId: string;
    title?: string;
    description?: string;
    category?: string;
  };

  if (!creatorId) {
    return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
  }

  // Verify the creator exists
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { id: true, role: true },
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const { uploadUrl, streamMediaId } = await createDirectUploadUrl();

  const video = await prisma.video.create({
    data: {
      userId: creator.id,
      cloudflareStreamId: streamMediaId,
      status: "PROCESSING",
      title: title ?? null,
      description: description ?? null,
      category: category ?? null,
      published: true,
    },
  });

  return NextResponse.json({
    uploadUrl,
    videoId: video.id,
    streamMediaId,
  });
}
