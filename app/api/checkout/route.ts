import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { getStripe } from "@/lib/stripe";
import { createOrder as createShopifyOrder } from "@/lib/shopify";

type CheckoutAddress = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type CheckoutShippingOption = {
  name: string;
  price: number;
  minDays: number | null;
  maxDays: number | null;
};

/**
 * POST /api/checkout
 *
 * Two actions:
 *   action: "create-intent" — creates Stripe PaymentIntent for the cart total
 *   action: "confirm"       — after payment, creates Shopify orders + DB records
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to checkout" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create-intent") {
      return handleCreateIntent(user, body);
    } else if (action === "confirm") {
      return handleConfirm(user, body);
    }

    return NextResponse.json(
      { error: "Invalid action. Expected 'create-intent' or 'confirm'." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during checkout" },
      { status: 500 }
    );
  }
}

// ── Create PaymentIntent ────────────────────────────────────────────────

async function handleCreateIntent(
  user: { id: string; email: string },
  body: {
    address: CheckoutAddress;
    shippingOption: CheckoutShippingOption;
  }
) {
  const { address, shippingOption } = body;

  if (!address || !shippingOption) {
    return NextResponse.json(
      { error: "Address and shipping option are required" },
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

  // Calculate subtotal from cart items
  let subtotal = 0;
  for (const item of cart.items) {
    const price = item.merchantProduct?.price ?? item.product?.price ?? 0;
    subtotal += price * item.quantity;
  }

  const shippingCost = shippingOption.price;
  const total = subtotal + shippingCost;

  // Convert to cents for Stripe
  const amountCents = Math.round(total * 100);

  if (amountCents < 50) {
    return NextResponse.json(
      { error: "Order total is too low" },
      { status: 400 }
    );
  }

  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    metadata: {
      cartId: cart.id,
      userId: user.id,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      shippingMethod: shippingOption.name,
      addressJson: JSON.stringify(address),
    },
    receipt_email: user.email,
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    amount: amountCents,
  });
}

// ── Confirm & Create Orders ────────────────────────────────────────────

async function handleConfirm(
  user: { id: string; email: string },
  body: {
    paymentIntentId: string;
    address: CheckoutAddress;
    shippingOption: CheckoutShippingOption;
  }
) {
  const { paymentIntentId, address, shippingOption } = body;

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "Payment intent ID is required" },
      { status: 400 }
    );
  }

  // Verify the payment succeeded
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    return NextResponse.json(
      { error: "Payment has not been completed" },
      { status: 400 }
    );
  }

  // Check if we already created an order for this payment (idempotency)
  const existingOrder = await prisma.order.findUnique({
    where: { stripePaymentId: paymentIntentId },
  });

  if (existingOrder) {
    return NextResponse.json({
      orderId: existingOrder.id,
      orderNumber: existingOrder.orderNumber,
    });
  }

  // Get the cart
  const { cart } = await getOrCreateCart();

  if (!cart.items.length) {
    return NextResponse.json(
      { error: "Cart is empty" },
      { status: 400 }
    );
  }

  // Load full merchant product data for Shopify order creation
  const merchantProductIds = cart.items
    .filter((item) => item.merchantProductId)
    .map((item) => item.merchantProductId!);

  const merchantProducts = merchantProductIds.length
    ? await prisma.merchantProduct.findMany({
        where: { id: { in: merchantProductIds } },
        include: {
          merchant: {
            select: {
              id: true,
              userId: true,
              shopifyDomain: true,
              shopifyAccessToken: true,
              storeName: true,
            },
          },
        },
      })
    : [];

  const merchantProductMap = new Map(merchantProducts.map((mp) => [mp.id, mp]));

  // Group cart items by merchant
  type GroupItem = {
    cartItem: (typeof cart.items)[number];
    merchantProduct: (typeof merchantProducts)[number] | null;
  };

  type MerchantGroup = {
    merchantId: string;
    merchantUserId: string;
    domain: string;
    accessToken: string;
    items: GroupItem[];
    subtotal: number;
  };

  const merchantGroups = new Map<string, MerchantGroup>();

  for (const item of cart.items) {
    const mp = item.merchantProductId
      ? merchantProductMap.get(item.merchantProductId) ?? null
      : null;

    const merchantId = mp?.merchant.id ?? "legacy";
    const price = mp?.price ?? item.product?.price ?? 0;

    if (!merchantGroups.has(merchantId)) {
      merchantGroups.set(merchantId, {
        merchantId,
        merchantUserId: mp?.merchant.userId ?? "",
        domain: mp?.merchant.shopifyDomain ?? "",
        accessToken: mp?.merchant.shopifyAccessToken ?? "",
        items: [],
        subtotal: 0,
      });
    }

    const group = merchantGroups.get(merchantId)!;
    group.items.push({ cartItem: item, merchantProduct: mp });
    group.subtotal += price * item.quantity;
  }

  // Calculate total
  const overallSubtotal = Array.from(merchantGroups.values()).reduce(
    (sum, g) => sum + g.subtotal,
    0
  );
  const shippingCost = shippingOption.price;
  const total = overallSubtotal + shippingCost;

  // Distribute shipping proportionally among merchants
  const shippingPerMerchant = (merchantId: string) => {
    if (overallSubtotal === 0) return 0;
    const group = merchantGroups.get(merchantId)!;
    return (group.subtotal / overallSubtotal) * shippingCost;
  };

  // Create orders — one per merchant
  const createdOrders: { id: string; orderNumber: string }[] = [];
  let primaryOrderId = "";
  let primaryOrderNumber = "";

  const shippingAddressJson = {
    line1: address.address1,
    line2: address.address2 ?? "",
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,
  };

  const merchantEntries = Array.from(merchantGroups.entries());
  for (const [merchantId, group] of merchantEntries) {
    const merchantShipping = shippingPerMerchant(merchantId);
    const groupTotal = group.subtotal + merchantShipping;
    const platformFee = groupTotal * 0.01; // 1% to Scrollr
    const creatorCommission = groupTotal * 0.03; // 3% to creator

    // Determine the creator who drove the sale (from the video context)
    // For MVP, use the merchant's userId as creator if they are a creator
    const creatorId = group.merchantUserId || null;

    // Create Scrollr Order record
    const isFirstOrder = createdOrders.length === 0;
    const order = await prisma.order.create({
      data: {
        buyerEmail: user.email,
        buyerName: `${address.firstName} ${address.lastName}`,
        buyerUserId: user.id,
        shippingAddress: shippingAddressJson,
        merchantId: merchantId === "legacy" ? undefined! : merchantId,
        creatorId: creatorId || undefined,
        subtotal: group.subtotal,
        shippingCost: merchantShipping,
        total: groupTotal,
        platformFee,
        creatorCommission,
        currency: "USD",
        stripePaymentId: isFirstOrder ? paymentIntentId : undefined,
        status: "PAID",
        items: {
          create: group.items
            .filter((gi: GroupItem) => gi.merchantProduct)
            .map((gi: GroupItem) => ({
              merchantProductId: gi.merchantProduct!.id,
              quantity: gi.cartItem.quantity,
              unitPrice: gi.merchantProduct!.price,
              total: gi.merchantProduct!.price * gi.cartItem.quantity,
            })),
        },
        commissions: {
          create: [
            {
              userId: creatorId || user.id,
              amount: creatorCommission,
              currency: "USD",
              type: "CREATOR_SALE",
              status: "PENDING",
            },
            {
              userId: creatorId || user.id,
              amount: platformFee,
              currency: "USD",
              type: "PLATFORM_FEE",
              status: "PENDING",
            },
          ],
        },
      },
    });

    createdOrders.push({
      id: order.id,
      orderNumber: order.orderNumber,
    });

    if (isFirstOrder) {
      primaryOrderId = order.id;
      primaryOrderNumber = order.orderNumber;
    }

    // Create Shopify order for merchant products (skip for legacy products)
    if (merchantId !== "legacy" && group.domain && group.accessToken) {
      try {
        const shopifyLineItems = group.items
          .filter((gi: GroupItem) => gi.merchantProduct)
          .map((gi: GroupItem) => {
            const mp = gi.merchantProduct!;
            const variantId = mp.shopifyVariantId
              ? parseInt(mp.shopifyVariantId, 10)
              : parseInt(mp.shopifyProductId, 10);
            return {
              variant_id: variantId,
              quantity: gi.cartItem.quantity,
              price: mp.price.toFixed(2),
            };
          });

        const shopifyOrder = await createShopifyOrder({
          domain: group.domain,
          accessToken: group.accessToken,
          lineItems: shopifyLineItems,
          shippingAddress: {
            first_name: address.firstName,
            last_name: address.lastName,
            address1: address.address1,
            address2: address.address2,
            city: address.city,
            province: address.state,
            zip: address.zip,
            country: address.country,
          },
          email: user.email,
          shippingLine: {
            title: shippingOption.name,
            price: merchantShipping.toFixed(2),
          },
          note: `Scrollr order ${primaryOrderNumber}`,
          tags: ["scrollr"],
        });

        // Update order with Shopify order ID
        await prisma.order.update({
          where: { id: order.id },
          data: {
            shopifyOrderId: shopifyOrder.id.toString(),
          },
        });
      } catch (err) {
        console.error(
          `Failed to create Shopify order for merchant ${merchantId}:`,
          err
        );
        // Order is still created in Scrollr — Shopify sync can be retried
      }
    }
  }

  // Clear the cart after successful order creation
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return NextResponse.json({
    orderId: primaryOrderId,
    orderNumber: primaryOrderNumber,
    totalOrders: createdOrders.length,
  });
}
