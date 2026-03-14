import { NextResponse } from "next/server";
import { getMerchant } from "@/lib/merchant-auth";
import { syncAllProducts } from "@/lib/shopify-sync";

export async function POST() {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!merchant.shopifyDomain || !merchant.shopifyAccessToken) {
    return NextResponse.json(
      { error: "Shopify not connected" },
      { status: 400 }
    );
  }

  // Rate limit: reject if synced in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (merchant.updatedAt > fiveMinutesAgo) {
    return NextResponse.json(
      { error: "Please wait at least 5 minutes between syncs" },
      { status: 429 }
    );
  }

  try {
    const result = await syncAllProducts(
      merchant.id,
      merchant.shopifyDomain,
      merchant.shopifyAccessToken
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Product sync failed:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
