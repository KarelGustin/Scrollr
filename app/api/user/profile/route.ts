import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

/** Get the current user's profile (used by client-side auth context) */
export async function GET(_req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Also fetch plan from subscription
  const { prisma } = await import("@/lib/prisma");
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: { plan: true },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    plan: subscription?.plan ?? "FREE",
  });
}
