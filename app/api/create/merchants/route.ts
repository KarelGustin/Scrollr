import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/create/merchants
 * Returns a list of active merchants for product tagging in the creator posting flow.
 */
export async function GET() {
  const merchants = await prisma.merchant.findMany({
    where: { active: true },
    select: {
      id: true,
      storeName: true,
      storeLogoUrl: true,
    },
    orderBy: { storeName: "asc" },
  });

  return NextResponse.json(merchants);
}
