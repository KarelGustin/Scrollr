import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { getShippingRates } from "@/lib/shopify";

/**
 * POST /api/checkout/shipping
 *
 * Fetches shipping rates for the current cart items grouped by merchant.
 * Accepts a shipping address and returns available shipping options.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body;

    if (!address?.address1 || !address?.city || !address?.state || !address?.zip || !address?.country) {
      return NextResponse.json(
        { error: "Complete shipping address is required" },
        { status: 400 }
      );
    }

    // Get cart with merchant product data
    const { cart } = await getOrCreateCart();

    if (!cart.items.length) {
      return NextResponse.json(
        { error: "Your cart is empty" },
        { status: 400 }
      );
    }

    // Gather merchant product IDs that have merchant data
    const merchantProductIds = cart.items
      .filter((item) => item.merchantProductId)
      .map((item) => item.merchantProductId!);

    if (merchantProductIds.length === 0) {
      // If cart only has legacy products (no merchant products),
      // return a flat-rate shipping option
      return NextResponse.json({
        rates: [
          {
            name: "Standard Shipping",
            price: 5.99,
            minDays: 5,
            maxDays: 10,
          },
          {
            name: "Express Shipping",
            price: 12.99,
            minDays: 2,
            maxDays: 4,
          },
        ],
      });
    }

    // Load full merchant product data with merchant credentials
    const merchantProducts = await prisma.merchantProduct.findMany({
      where: { id: { in: merchantProductIds } },
      include: {
        merchant: {
          select: {
            id: true,
            shopifyDomain: true,
            shopifyAccessToken: true,
            storeName: true,
          },
        },
      },
    });

    // Group items by merchant
    const merchantGroups = new Map<
      string,
      {
        domain: string;
        accessToken: string;
        lineItems: { variant_id: number; quantity: number }[];
      }
    >();

    for (const mp of merchantProducts) {
      const cartItem = cart.items.find((i) => i.merchantProductId === mp.id);
      if (!cartItem) continue;

      const merchantId = mp.merchant.id;
      if (!merchantGroups.has(merchantId)) {
        merchantGroups.set(merchantId, {
          domain: mp.merchant.shopifyDomain,
          accessToken: mp.merchant.shopifyAccessToken,
          lineItems: [],
        });
      }

      const group = merchantGroups.get(merchantId)!;
      // Use variant ID if available, otherwise fallback to product ID
      const variantId = mp.shopifyVariantId
        ? parseInt(mp.shopifyVariantId, 10)
        : parseInt(mp.shopifyProductId, 10);

      group.lineItems.push({
        variant_id: variantId,
        quantity: cartItem.quantity,
      });
    }

    // Fetch shipping rates from each merchant's Shopify store
    const allRates: { name: string; price: number; minDays: number | null; maxDays: number | null }[] = [];
    const seenRateNames = new Set<string>();

    const merchantEntries = Array.from(merchantGroups.entries());
    for (const [, group] of merchantEntries) {
      try {
        const shopifyRates = await getShippingRates(
          group.domain,
          group.accessToken,
          {
            address1: address.address1,
            city: address.city,
            province: address.state,
            zip: address.zip,
            country: address.country,
          },
          group.lineItems
        );

        for (const rate of shopifyRates) {
          // Deduplicate by name — if multiple merchants offer same shipping method,
          // sum the prices
          const existing = allRates.find((r) => r.name === rate.name);
          const priceNum = parseFloat(rate.price);

          if (existing) {
            existing.price += priceNum;
          } else if (!seenRateNames.has(rate.name)) {
            seenRateNames.add(rate.name);
            allRates.push({
              name: rate.name,
              price: priceNum,
              minDays: rate.min_delivery_days,
              maxDays: rate.max_delivery_days,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to fetch shipping rates for merchant:`, err);
        // If a merchant fails, provide a fallback rate
      }
    }

    // If no rates came back from any merchant, provide fallback
    if (allRates.length === 0) {
      allRates.push(
        {
          name: "Standard Shipping",
          price: 5.99,
          minDays: 5,
          maxDays: 10,
        },
        {
          name: "Express Shipping",
          price: 12.99,
          minDays: 2,
          maxDays: 4,
        }
      );
    }

    // Sort by price ascending
    allRates.sort((a, b) => a.price - b.price);

    return NextResponse.json({ rates: allRates });
  } catch (err) {
    console.error("Shipping rates error:", err);
    return NextResponse.json(
      { error: "Failed to calculate shipping rates" },
      { status: 500 }
    );
  }
}
