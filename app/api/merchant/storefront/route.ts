import { NextRequest, NextResponse } from "next/server";
import { getMerchant } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ merchant });
}

export async function PATCH(req: NextRequest) {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { storeTheme, storeDescription } = body;

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      ...(storeTheme !== undefined && { storeTheme }),
      ...(storeDescription !== undefined && { storeDescription }),
    },
    select: {
      id: true,
      userId: true,
      shopifyDomain: true,
      storeName: true,
      storeLogoUrl: true,
      shippingPolicy: true,
      returnPolicy: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      slug: true,
      storeDescription: true,
      storeTheme: true,
      stripeConnectAccountId: true,
      stripeConnectOnboarded: true,
    },
  });

  return NextResponse.json({ merchant: updated });
}
