import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if already a merchant
  const existing = await prisma.merchant.findUnique({ where: { userId: user.id } });
  if (existing) return NextResponse.json({ error: "Already registered as merchant" }, { status: 400 });

  const body = await request.json();
  const { storeName, storeLogoUrl, category, shopifyDomain } = body;

  if (!storeName) {
    return NextResponse.json({ error: "Store name is required" }, { status: 400 });
  }

  const domain = shopifyDomain || `${storeName.toLowerCase().replace(/[^a-z0-9]/g, "")}.myshopify.com`;

  // Update user role to MERCHANT
  await prisma.user.update({
    where: { id: user.id },
    data: { role: "MERCHANT" },
  });

  // Create merchant record
  const merchant = await prisma.merchant.create({
    data: {
      userId: user.id,
      shopifyDomain: domain,
      shopifyAccessToken: `tok_${Date.now()}`,
      storeName,
      storeLogoUrl: storeLogoUrl || null,
    },
  });

  return NextResponse.json(merchant, { status: 201 });
}
