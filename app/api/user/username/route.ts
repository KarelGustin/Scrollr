import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

/** Check username availability: GET /api/user/username?username=foo */
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");

  if (!username || !usernameRegex.test(username)) {
    return NextResponse.json(
      { error: "Invalid username format" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  return NextResponse.json({ taken: !!existing });
}

/** Set username (registration): PATCH /api/user/username */
export async function PATCH(req: NextRequest) {
  const appUser = await getUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { username } = body as { username: string };

  if (!username || typeof username !== "string") {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  if (!usernameRegex.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-20 characters and contain only letters, numbers, and underscores",
      },
      { status: 400 }
    );
  }

  // Check uniqueness
  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existing && existing.id !== appUser.id) {
    return NextResponse.json(
      { error: "Username is already taken" },
      { status: 409 }
    );
  }

  const user = await prisma.user.update({
    where: { id: appUser.id },
    data: { username },
  });

  return NextResponse.json({ username: user.username });
}

/** Update profile: POST /api/user/username */
export async function POST(req: NextRequest) {
  const appUser = await getUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { username, name, avatarUrl, bio } = body as {
    username?: string;
    name?: string;
    avatarUrl?: string | null;
    bio?: string | null;
  };

  // Validate username if provided
  if (username !== undefined) {
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existing && existing.id !== appUser.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }
  }

  // Validate bio length
  if (bio !== undefined && bio !== null && bio.length > 160) {
    return NextResponse.json(
      { error: "Bio must be 160 characters or fewer" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: appUser.id },
    data: {
      ...(username !== undefined && { username }),
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(bio !== undefined && { bio }),
    },
  });

  return NextResponse.json({
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  });
}

/** Delete account: DELETE /api/user/username */
export async function DELETE() {
  const appUser = await getUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: appUser.id } });

  return NextResponse.json({ success: true });
}
