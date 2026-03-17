import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { userId: user.id },
    select: { syncStatus: true },
  });

  if (!merchant) {
    return NextResponse.json({ error: "Not a merchant" }, { status: 404 });
  }

  const productCount = await prisma.merchantProduct.count({
    where: {
      merchant: { userId: user.id },
      available: true,
    },
  });

  return NextResponse.json({
    syncStatus: merchant.syncStatus,
    productCount,
  });
}
