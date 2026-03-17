import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = [
  "fashion",
  "beauty",
  "tech",
  "fitness",
  "food",
  "home",
  "art",
  "other",
];

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const application = await prisma.creatorApplication.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!application) {
    return NextResponse.json(null);
  }

  return NextResponse.json(application);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if already a creator
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role === "CREATOR" || dbUser?.role === "ADMIN") {
    return NextResponse.json({ error: "Already a creator" }, { status: 400 });
  }

  // Check for existing pending application
  const existing = await prisma.creatorApplication.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You already have a pending application" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { category, socialLinks, pitch, primaryPlatform, followerRange } = body as {
    category: string;
    socialLinks: Record<string, string>;
    pitch: string;
    primaryPlatform?: string;
    followerRange?: string;
  };

  // Validate category
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Validate social links — at least one required
  const validPlatforms = ["instagram", "tiktok", "youtube", "twitter"];
  const filteredLinks: Record<string, string> = {};
  let hasLink = false;

  for (const platform of validPlatforms) {
    const value = socialLinks?.[platform]?.trim();
    if (value) {
      filteredLinks[platform] = value;
      hasLink = true;
    }
  }

  if (!hasLink) {
    return NextResponse.json(
      { error: "At least one social link is required" },
      { status: 400 }
    );
  }

  // Validate pitch
  if (!pitch || pitch.trim().length === 0) {
    return NextResponse.json({ error: "Pitch is required" }, { status: 400 });
  }
  if (pitch.trim().length > 200) {
    return NextResponse.json(
      { error: "Pitch must be 200 characters or less" },
      { status: 400 }
    );
  }

  // Parse follower count from range
  const followerCountMap: Record<string, number> = {
    "1k-5k": 3000,
    "5k-10k": 7500,
    "10k-50k": 30000,
    "50k-100k": 75000,
    "100k+": 150000,
  };

  const application = await prisma.creatorApplication.create({
    data: {
      userId: user.id,
      category,
      socialLinks: filteredLinks,
      pitch: pitch.trim(),
      primaryPlatform: primaryPlatform || null,
      followerCount: followerRange ? (followerCountMap[followerRange] ?? null) : null,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
