import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchShopInfo, registerWebhooks } from "@/lib/shopify";

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * GET: Shopify OAuth callback.
 * Receives code + shop + state from Shopify after merchant authorizes.
 */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(`${APP_URL}/login?error=auth_required`);
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  if (!code || !shop || !state) {
    return NextResponse.redirect(
      `${APP_URL}/settings?error=missing_params`
    );
  }

  // Verify state matches cookie (CSRF protection)
  const storedState = req.cookies.get("shopify_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      `${APP_URL}/settings?error=invalid_state`
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: SHOPIFY_CLIENT_ID,
          client_secret: SHOPIFY_CLIENT_SECRET,
          code,
        }),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Shopify token exchange failed:", errText);
      return NextResponse.redirect(
        `${APP_URL}/settings?error=token_exchange_failed`
      );
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const accessToken = tokenData.access_token;

    // Fetch shop info
    const shopInfo = await fetchShopInfo(shop, accessToken);

    // Create or update Merchant record in Prisma
    await prisma.merchant.upsert({
      where: { userId: user.id },
      update: {
        shopifyDomain: shop,
        shopifyAccessToken: accessToken,
        shopifyShopId: String(shopInfo.id),
        storeName: shopInfo.name,
        active: true,
      },
      create: {
        userId: user.id,
        shopifyDomain: shop,
        shopifyAccessToken: accessToken,
        shopifyShopId: String(shopInfo.id),
        storeName: shopInfo.name,
      },
    });

    // Register webhooks for ongoing sync
    await registerWebhooks(shop, accessToken, APP_URL);

    // Clear the OAuth state cookie
    const response = NextResponse.redirect(
      `${APP_URL}/settings?shopify=connected`
    );
    response.cookies.delete("shopify_oauth_state");

    return response;
  } catch (err) {
    console.error("Shopify OAuth callback error:", err);
    return NextResponse.redirect(
      `${APP_URL}/settings?error=shopify_connect_failed`
    );
  }
}
