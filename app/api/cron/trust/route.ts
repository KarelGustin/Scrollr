export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTrustLevel } from "@/lib/planLimits";

/**
 * Cron job to update trust levels for all users.
 * Should run daily. Updates trust based on account age and strike history.
 */
export async function GET() {
  const users = await prisma.user.findMany({
    where: {
      trustLevel: { not: "TRUSTED" },
    },
    select: { id: true },
  });

  let updated = 0;
  for (const user of users) {
    await updateTrustLevel(user.id);
    updated++;
  }

  return NextResponse.json({ updated });
}
