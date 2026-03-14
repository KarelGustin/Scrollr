import { NextRequest, NextResponse } from "next/server";
import { getMerchant } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ merchant });
}

export async function PATCH(request: NextRequest) {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { storeName, storeLogoUrl, shippingPolicy, returnPolicy, active, shopifyDomain } = body;

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      ...(storeName !== undefined && { storeName }),
      ...(storeLogoUrl !== undefined && { storeLogoUrl }),
      ...(shippingPolicy !== undefined && { shippingPolicy }),
      ...(returnPolicy !== undefined && { returnPolicy }),
      ...(active !== undefined && { active }),
      ...(shopifyDomain !== undefined && { shopifyDomain }),
    },
  });

  return NextResponse.json({ merchant: updated });
}
