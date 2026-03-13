import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

/** Get the current user's profile (used by client-side auth context) */
export async function GET(_req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Also fetch plan and role from DB
  const { prisma } = await import("@/lib/prisma");
  const [subscription, dbUser] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { plan: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    }),
  ]);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    plan: subscription?.plan ?? "FREE",
    role: dbUser?.role ?? "USER",
  });
}
