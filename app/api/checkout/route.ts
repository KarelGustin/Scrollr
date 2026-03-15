import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import { createMarketplacePaymentIntent, createMerchantTransfer, calculateFeeSplit } from "@/lib/stripe-connect";
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

  // Generate transfer group to link all transfers for this checkout
  const transferGroup = `checkout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const paymentIntent = await createMarketplacePaymentIntent({
    amountCents,
    currency: "eur",
    transferGroup,
    metadata: {
      cartId: cart.id,
      buyerEmail: user.email,
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    transferGroup,
    total,
  });
}

// ── Confirm & Create Orders ────────────────────────────────────────────

async function handleConfirm(
  user: { id: string; email: string },
  body: {
    paymentIntentId: string;
    transferGroup: string;
    address: CheckoutAddress;
    shippingOption: CheckoutShippingOption;
  }
) {
  const { paymentIntentId, transferGroup, address, shippingOption } = body;

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

  // Check if we already created a checkout for this payment (idempotency)
  const existingCheckout = await prisma.checkout.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { orders: true },
  });

  if (existingCheckout && existingCheckout.orders.length > 0) {
    const primaryOrder = existingCheckout.orders[0];
    return NextResponse.json({
      orderId: primaryOrder.id,
      orderNumber: primaryOrder.orderNumber,
      totalOrders: existingCheckout.orders.length,
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
              stripeConnectAccountId: true,
              stripeConnectOnboarded: true,
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
    stripeConnectAccountId: string | null;
    stripeConnectOnboarded: boolean;
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
        stripeConnectAccountId: mp?.merchant.stripeConnectAccountId ?? null,
        stripeConnectOnboarded: mp?.merchant.stripeConnectOnboarded ?? false,
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

  // Create Checkout record
  const checkout = await prisma.checkout.create({
    data: {
      stripePaymentIntentId: paymentIntentId,
      buyerUserId: user.id,
      buyerEmail: user.email,
      total,
    },
  });

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
    const fees = calculateFeeSplit(group.subtotal, merchantShipping);

    // Determine the creator who drove the sale (from the video context)
    // For MVP, use the merchant's userId as creator if they are a creator
    const creatorId = group.merchantUserId || null;

    let stripeTransferId: string | undefined;

    // Transfer to merchant if they have Stripe Connect
    if (group.stripeConnectAccountId && group.stripeConnectOnboarded) {
      try {
        const transfer = await createMerchantTransfer({
          amountCents: Math.round(fees.merchantPayout * 100),
          currency: "eur",
          destinationAccountId: group.stripeConnectAccountId,
          transferGroup,
          metadata: { merchantId },
        });
        stripeTransferId = transfer.id;
      } catch (err) {
        console.error(
          `Failed to create Stripe transfer for merchant ${merchantId}:`,
          err
        );
        // Continue without transfer — can be retried later
      }
    }

    // Create Scrollr Order record
    const order = await prisma.order.create({
      data: {
        buyerEmail: user.email,
        buyerName: `${address.firstName} ${address.lastName}`,
        buyerUserId: user.id,
        shippingAddress: shippingAddressJson,
        merchantId: merchantId === "legacy" ? undefined! : merchantId,
        creatorId: creatorId || undefined,
        checkoutId: checkout.id,
        subtotal: group.subtotal,
        shippingCost: merchantShipping,
        total: fees.total,
        platformFee: fees.platformFee,
        creatorCommission: fees.creatorCommission,
        currency: "EUR",
        stripePaymentId: paymentIntentId,
        stripeTransferId,
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
              amount: fees.creatorCommission,
              currency: "EUR",
              type: "CREATOR_SALE" as const,
              status: "PENDING" as const,
            },
            {
              userId: creatorId || user.id,
              amount: fees.platformFee,
              currency: "EUR",
              type: "PLATFORM_FEE" as const,
              status: "PENDING" as const,
            },
          ],
        },
      },
    });

    createdOrders.push({
      id: order.id,
      orderNumber: order.orderNumber,
    });

    if (createdOrders.length === 1) {
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
