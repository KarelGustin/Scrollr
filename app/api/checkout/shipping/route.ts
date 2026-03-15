import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCart } from "@/lib/cart";
import {
  calculateShippingRatesForCart,
  normalizeAddress,
} from "@/lib/checkout-shipping";

/**
 * POST /api/checkout/shipping
 *
 * Fetches shipping rates for the current cart items grouped by merchant.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const address = normalizeAddress(body?.address);
    if (!address) {
      return NextResponse.json(
        { error: "Complete shipping address is required" },
        { status: 400 }
      );
    }

    const { cart } = await getOrCreateCart();
    if (!cart.items.length) {
      return NextResponse.json(
        { error: "Your cart is empty" },
        { status: 400 }
      );
    }

    const rates = await calculateShippingRatesForCart(
      cart.items.map((item) => ({
        merchantProductId: item.merchantProductId,
        quantity: item.quantity,
      })),
      address
    );

    return NextResponse.json({ rates });
  } catch (err) {
    console.error("Shipping rates error:", err);
    return NextResponse.json(
      { error: "Failed to calculate shipping rates" },
      { status: 500 }
    );
  }
}
