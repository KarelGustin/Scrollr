import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SCOPES = "read_products,write_orders,read_shipping";
const REDIRECT_URI = `${APP_URL}/api/shopify/callback`;

/**
 * GET: Initiates Shopify OAuth install flow.
 * Redirects the user to Shopify's authorization page.
 *
 * Usage: /api/shopify/install?shop=mystore.myshopify.com
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");
  const returnTo = searchParams.get("returnTo");
  const safeReturnTo =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : null;

  if (!shop || !shop.endsWith(".myshopify.com")) {
    return NextResponse.json(
      { error: "Missing or invalid shop parameter. Expected format: mystore.myshopify.com" },
      { status: 400 }
    );
  }

  // Sanitize shop domain
  const sanitizedShop = shop.replace(/[^a-zA-Z0-9.-]/g, "");
  if (sanitizedShop !== shop) {
    return NextResponse.json(
      { error: "Invalid shop domain" },
      { status: 400 }
    );
  }

  // Generate a random state nonce for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  // Build the Shopify OAuth URL
  const authUrl = new URL(`https://${sanitizedShop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", SHOPIFY_CLIENT_ID);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);

  // Store the state nonce in a cookie for verification in the callback
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  // Store returnTo path so callback redirects back to the right page
  if (safeReturnTo) {
    response.cookies.set("shopify_return_to", safeReturnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }

  return response;
}
