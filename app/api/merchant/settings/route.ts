import { NextRequest, NextResponse } from "next/server";
import { getMerchant } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

function serializeMerchant(merchant: {
  id: string;
  userId: string;
  shopifyDomain: string | null;
  storeName: string | null;
  storeLogoUrl: string | null;
  shippingPolicy: string | null;
  returnPolicy: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  slug: string | null;
  storeDescription: string | null;
  storeTheme: string;
  stripeConnectAccountId: string | null;
  stripeConnectOnboarded: boolean;
}) {
  return merchant;
}

export async function GET() {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ merchant: serializeMerchant(merchant) });
}

export async function PATCH(request: NextRequest) {
  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { storeName, storeLogoUrl, shippingPolicy, returnPolicy, active, disconnectShopify } = body as {
    storeName?: string;
    storeLogoUrl?: string | null;
    shippingPolicy?: string | null;
    returnPolicy?: string | null;
    active?: boolean;
    disconnectShopify?: boolean;
  };

  const shopifyDisconnectUpdate =
    disconnectShopify === true
      ? {
          shopifyDomain: `disconnected-${merchant.id}.invalid`,
          shopifyAccessToken: "",
          active: false,
        }
      : {};

  const updated = await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      ...(storeName !== undefined && { storeName }),
      ...(storeLogoUrl !== undefined && { storeLogoUrl }),
      ...(shippingPolicy !== undefined && { shippingPolicy }),
      ...(returnPolicy !== undefined && { returnPolicy }),
      ...(active !== undefined && { active }),
      ...shopifyDisconnectUpdate,
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

  return NextResponse.json({ merchant: serializeMerchant(updated) });
}
