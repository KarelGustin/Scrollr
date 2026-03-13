import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyStrike } from "@/lib/planLimits";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const search = searchParams.get("search")?.trim();

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { username: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        trustLevel: true,
        strikeCount: true,
        bannedUntil: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pageSize });
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { userId, action, role } = body as {
    userId: string;
    action: "change_role" | "apply_strike" | "reset_strikes" | "ban" | "unban";
    role?: string;
  };

  if (!userId || !action) {
    return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (action === "change_role") {
    if (role !== "ADMIN" && role !== "USER") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({ success: true, action: "role_changed", role });
  }

  if (action === "apply_strike") {
    const strikeResult = await applyStrike(userId);
    return NextResponse.json({
      success: true,
      action: "strike_applied",
      strike: strikeResult,
    });
  }

  if (action === "reset_strikes") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        strikeCount: 0,
        lastStrikeAt: null,
      },
    });

    return NextResponse.json({ success: true, action: "strikes_reset" });
  }

  if (action === "ban") {
    // Apply a permanent ban
    await prisma.user.update({
      where: { id: userId },
      data: { bannedUntil: new Date("2099-12-31") },
    });

    return NextResponse.json({ success: true, action: "banned" });
  }

  if (action === "unban") {
    await prisma.user.update({
      where: { id: userId },
      data: { bannedUntil: null },
    });

    return NextResponse.json({ success: true, action: "unbanned" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
