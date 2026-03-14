import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchShopInfo, registerWebhooks } from "@/lib/shopify";
import { syncAllProducts } from "@/lib/shopify-sync";

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

  // Read returnTo from cookie
  const returnTo = req.cookies.get("shopify_return_to")?.value;
  const redirectBase = returnTo || "/settings";

  if (!code || !shop || !state) {
    return NextResponse.redirect(
      `${APP_URL}${redirectBase}?error=missing_params`
    );
  }

  // Verify state matches cookie (CSRF protection)
  const storedState = req.cookies.get("shopify_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      `${APP_URL}${redirectBase}?error=invalid_state`
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
        `${APP_URL}${redirectBase}?error=token_exchange_failed`
      );
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const accessToken = tokenData.access_token;

    // Fetch shop info
    const shopInfo = await fetchShopInfo(shop, accessToken);

    // Create or update Merchant record in Prisma
    const merchant = await prisma.merchant.upsert({
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

    // Trigger initial product sync (fire-and-forget to not block redirect)
    syncAllProducts(merchant.id, shop, accessToken).catch((err) => {
      console.error("Initial product sync failed:", err);
    });

    // Clear cookies and redirect
    const response = NextResponse.redirect(
      `${APP_URL}${redirectBase}?shopify=connected`
    );
    response.cookies.delete("shopify_oauth_state");
    response.cookies.delete("shopify_return_to");

    return response;
  } catch (err) {
    console.error("Shopify OAuth callback error:", err);
    return NextResponse.redirect(
      `${APP_URL}${redirectBase}?error=shopify_connect_failed`
    );
  }
}
