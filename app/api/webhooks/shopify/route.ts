import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;

/**
 * Verify that the webhook request is genuinely from Shopify
 * by comparing the HMAC signature.
 */
function verifyShopifyHmac(body: string, hmacHeader: string): boolean {
  const digest = crypto
    .createHmac("sha256", SHOPIFY_CLIENT_SECRET)
    .update(body, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(hmacHeader)
  );
}

/**
 * POST: Handles incoming webhook events from Shopify.
 */
export async function POST(req: NextRequest) {
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  const topic = req.headers.get("x-shopify-topic");
  const shopDomain = req.headers.get("x-shopify-shop-domain");

  if (!hmacHeader || !topic || !shopDomain) {
    return NextResponse.json(
      { error: "Missing required headers" },
      { status: 400 }
    );
  }

  // Read raw body for HMAC verification
  const rawBody = await req.text();

  // Verify HMAC signature
  try {
    const isValid = verifyShopifyHmac(rawBody, hmacHeader);
    if (!isValid) {
      console.error("Shopify webhook HMAC verification failed");
      return NextResponse.json(
        { error: "Invalid HMAC signature" },
        { status: 401 }
      );
    }
  } catch {
    console.error("Shopify webhook HMAC verification error");
    return NextResponse.json(
      { error: "HMAC verification error" },
      { status: 401 }
    );
  }

  const payload = JSON.parse(rawBody);

  try {
    switch (topic) {
      case "products/create":
        await handleProductUpdate(shopDomain, payload);
        break;

      case "products/update":
        await handleProductUpdate(shopDomain, payload);
        break;

      case "products/delete":
        await handleProductDelete(shopDomain, payload);
        break;

      case "orders/fulfilled":
        await handleOrderFulfilled(shopDomain, payload);
        break;

      case "app/uninstalled":
        await handleAppUninstalled(shopDomain);
        break;

      default:
        console.log(`Unhandled Shopify webhook topic: ${topic}`);
    }
  } catch (err) {
    console.error(`Error handling Shopify webhook ${topic}:`, err);
    // Still return 200 to prevent Shopify from retrying
  }

  return NextResponse.json({ ok: true });
}

/**
 * Sync product data when updated in Shopify.
 */
async function handleProductUpdate(
  shopDomain: string,
  payload: {
    id: number;
    title: string;
    body_html: string | null;
    vendor: string;
    product_type: string;
    tags: string;
    image: { src: string } | null;
    variants: {
      id: number;
      price: string;
      compare_at_price: string | null;
      sku: string | null;
      inventory_quantity: number;
    }[];
  }
) {
  const merchant = await prisma.merchant.findUnique({
    where: { shopifyDomain: shopDomain },
  });

  if (!merchant) return;

  const firstVariant = payload.variants?.[0];

  // Upsert each variant (or just the first for simple products)
  const variants = payload.variants?.length ? payload.variants : [];

  for (const variant of variants) {
    await prisma.merchantProduct.upsert({
      where: {
        merchantId_shopifyProductId_shopifyVariantId: {
          merchantId: merchant.id,
          shopifyProductId: String(payload.id),
          shopifyVariantId: String(variant.id),
        },
      },
      update: {
        title: payload.title,
        description: payload.body_html ?? undefined,
        imageUrl: payload.image?.src ?? undefined,
        price: parseFloat(variant.price),
        compareAtPrice: variant.compare_at_price
          ? parseFloat(variant.compare_at_price)
          : null,
        sku: variant.sku,
        inventoryQuantity: variant.inventory_quantity,
        available: variant.inventory_quantity > 0,
        tags: payload.tags || null,
        productType: payload.product_type || null,
        vendor: payload.vendor || null,
      },
      create: {
        merchantId: merchant.id,
        shopifyProductId: String(payload.id),
        shopifyVariantId: String(variant.id),
        title: payload.title,
        description: payload.body_html ?? null,
        imageUrl: payload.image?.src ?? null,
        price: parseFloat(variant.price),
        compareAtPrice: variant.compare_at_price
          ? parseFloat(variant.compare_at_price)
          : null,
        sku: variant.sku,
        inventoryQuantity: variant.inventory_quantity,
        available: variant.inventory_quantity > 0,
        tags: payload.tags || null,
        productType: payload.product_type || null,
        vendor: payload.vendor || null,
      },
    });
  }
}

/**
 * Mark all variants of a deleted product as unavailable.
 */
async function handleProductDelete(
  shopDomain: string,
  payload: { id: number }
) {
  const merchant = await prisma.merchant.findUnique({
    where: { shopifyDomain: shopDomain },
  });

  if (!merchant) return;

  await prisma.merchantProduct.updateMany({
    where: {
      merchantId: merchant.id,
      shopifyProductId: String(payload.id),
    },
    data: { available: false },
  });
}

/**
 * Update order status when Shopify marks it as fulfilled.
 */
async function handleOrderFulfilled(
  shopDomain: string,
  payload: { id: number }
) {
  // Find the order by its Shopify order ID
  const order = await prisma.order.findUnique({
    where: { shopifyOrderId: String(payload.id) },
  });

  if (!order) return;

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "FULFILLED" },
  });
}

/**
 * Deactivate merchant when the Shopify app is uninstalled.
 */
async function handleAppUninstalled(shopDomain: string) {
  await prisma.merchant.updateMany({
    where: { shopifyDomain: shopDomain },
    data: { active: false },
  });
}
