import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fetchShopInfo, registerWebhooks } from "@/lib/shopify";
import { syncAllProducts } from "@/lib/shopify-sync";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const MAX_CALLBACK_AGE_SECONDS = 300;

function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

function verifyShopifyCallbackHmac(searchParams: URLSearchParams): boolean {
  const hmac = searchParams.get("hmac");
  if (!hmac) return false;

  const entries = Array.from(searchParams.entries())
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b));

  const message = entries
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const digest = crypto
    .createHmac("sha256", SHOPIFY_CLIENT_SECRET)
    .update(message)
    .digest("hex");

  const expected = Buffer.from(digest, "utf8");
  const actual = Buffer.from(hmac, "utf8");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function getSafeReturnPath(path: string | undefined): string {
  if (!path) return "/merchant";
  if (!path.startsWith("/") || path.startsWith("//")) return "/merchant";
  return path;
}

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
  const timestamp = searchParams.get("timestamp");

  if (!code || !shop || !state || !timestamp) {
    return NextResponse.redirect(
      `${APP_URL}/login?error=missing_params`
    );
  }

  if (!isValidShopDomain(shop)) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_shop`);
  }

  if (!verifyShopifyCallbackHmac(searchParams)) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_hmac`);
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_CALLBACK_AGE_SECONDS) {
    return NextResponse.redirect(`${APP_URL}/login?error=expired_callback`);
  }

  // Verify state matches cookie (CSRF protection)
  const storedState = req.cookies.get("shopify_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      `${APP_URL}/login?error=invalid_state`
    );
  }

  const returnPath = getSafeReturnPath(req.cookies.get("shopify_return_to")?.value);

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
      // Auto-generate username from shop name
      const baseUsername = (shopInfo.name || shop.replace(".myshopify.com", ""))
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20);
      let username = baseUsername;
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        username = `${baseUsername.slice(0, 16)}${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await prisma.user.create({
        data: {
          email: shopEmail,
          name: shopInfo.name || shop.replace(".myshopify.com", ""),
          username,
          role: "MERCHANT",
        },
      });
    } else {
      // Auto-set username if missing
      if (!user.username) {
        const baseUsername = (shopInfo.name || shop.replace(".myshopify.com", ""))
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 20);
        let username = baseUsername;
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
          username = `${baseUsername.slice(0, 16)}${Math.floor(1000 + Math.random() * 9000)}`;
        }
        user = await prisma.user.update({
          where: { id: user.id },
          data: { username, role: "MERCHANT" },
        });
      } else if (user.role !== "MERCHANT") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "MERCHANT" },
        });
      }
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
        storeLogoUrl: undefined,
        syncStatus: "SYNCING",
      },
      create: {
        userId: user.id,
        shopifyDomain: shop,
        shopifyAccessToken: accessToken,
        shopifyShopId: String(shopInfo.id),
        storeName: shopInfo.name || shop,
        storeLogoUrl: undefined,
        slug,
        storeTheme: "light",
        syncStatus: "SYNCING",
      },
    });

    // Register webhooks for ongoing sync
    await registerWebhooks(shop, accessToken, APP_URL);

    // Trigger initial product sync (fire-and-forget to not block redirect)
    syncAllProducts(merchant.id, shop, accessToken).catch((err) => {
      console.error("Initial product sync failed:", err);
    });

    // Clear OAuth cookies and redirect to merchant dashboard
    const response = NextResponse.redirect(`${APP_URL}${returnPath}`);
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
