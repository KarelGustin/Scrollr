import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchShopInfo, registerWebhooks } from "@/lib/shopify";
import { syncAllProducts } from "@/lib/shopify-sync";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * GET: Shopify OAuth callback.
 * Receives code + shop + state from Shopify after merchant authorizes.
 * The Shopify app install IS registration — no existing account required.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  if (!code || !shop || !state) {
    return NextResponse.redirect(
      `${APP_URL}/login?error=missing_params`
    );
  }

  // Verify state matches cookie (CSRF protection)
  const storedState = req.cookies.get("shopify_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      `${APP_URL}/login?error=invalid_state`
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
        `${APP_URL}/login?error=token_exchange_failed`
      );
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const accessToken = tokenData.access_token;

    // Fetch shop info
    const shopInfo = await fetchShopInfo(shop, accessToken);
    const shopEmail = shopInfo.email;

    // Find or create Prisma user from shop email
    let user = await prisma.user.findUnique({ where: { email: shopEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: shopEmail,
          name: shopInfo.name || shop.replace(".myshopify.com", ""),
          role: "MERCHANT",
        },
      });
    } else if (user.role !== "MERCHANT") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "MERCHANT" },
      });
    }

    // Generate a unique slug for the merchant store
    const slug = await ensureUniqueSlug(generateSlug(shopInfo.name || shop));

    // Create or update Merchant record in Prisma
    const merchant = await prisma.merchant.upsert({
      where: { shopifyDomain: shop },
      update: {
        shopifyAccessToken: accessToken,
        storeName: shopInfo.name || shop,
        shopifyShopId: String(shopInfo.id),
      },
      create: {
        userId: user.id,
        shopifyDomain: shop,
        shopifyAccessToken: accessToken,
        shopifyShopId: String(shopInfo.id),
        storeName: shopInfo.name || shop,
        slug,
        storeTheme: "light",
      },
    });

    // Register webhooks for ongoing sync
    await registerWebhooks(shop, accessToken, APP_URL);

    // Trigger initial product sync (fire-and-forget to not block redirect)
    syncAllProducts(merchant.id, shop, accessToken).catch((err) => {
      console.error("Initial product sync failed:", err);
    });

    // Clear OAuth cookies and redirect to merchant dashboard
    const response = NextResponse.redirect(`${APP_URL}/merchant`);
    response.cookies.delete("shopify_oauth_state");
    response.cookies.delete("shopify_return_to");

    return response;
  } catch (err) {
    console.error("Shopify OAuth callback error:", err);
    return NextResponse.redirect(
      `${APP_URL}/login?error=shopify_connect_failed`
    );
  }
}
