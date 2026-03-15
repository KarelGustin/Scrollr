import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const followingId = searchParams.get("followingId");

  // Single follow check
  if (followingId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId } },
    });
    return NextResponse.json({ isFollowing: !!follow });
  }

  // Full follows list
  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          bio: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(follows.map((f) => f.following));
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { followingId } = await request.json();
  if (!followingId) return NextResponse.json({ error: "Missing followingId" }, { status: 400 });
  if (followingId === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const follow = await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: user.id, followingId } },
    create: { followerId: user.id, followingId },
    update: {},
  });

  return NextResponse.json(follow, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { followingId } = await request.json();
  if (!followingId) return NextResponse.json({ error: "Missing followingId" }, { status: 400 });

  await prisma.follow.deleteMany({
    where: { followerId: user.id, followingId },
  });

  return NextResponse.json({ success: true });
}
