import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";
import {
  createMarketplacePaymentIntent,
  createMerchantTransfer,
  calculateFeeSplit,
} from "@/lib/stripe-connect";
import { getStripe } from "@/lib/stripe";
import { createOrder as createShopifyOrder } from "@/lib/shopify";
import {
  calculateShippingRatesForCart,
  normalizeAddress,
  normalizeShippingOptionName,
} from "@/lib/checkout-shipping";

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

type CartSnapshot = {
  hash: string;
  subtotalCents: number;
  hasLegacyItems: boolean;
};

function normalizeCheckoutAddress(input: unknown): CheckoutAddress | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const firstName = String(value.firstName ?? "").trim();
  const lastName = String(value.lastName ?? "").trim();
  const address1 = String(value.address1 ?? "").trim();
  const city = String(value.city ?? "").trim();
  const state = String(value.state ?? "").trim();
  const zip = String(value.zip ?? "").trim();
  const country = String(value.country ?? "").trim();

  if (!firstName || !lastName || !address1 || !city || !state || !zip || !country) {
    return null;
  }

  const address2 = String(value.address2 ?? "").trim();
  return {
    firstName,
    lastName,
    address1,
    address2: address2 || undefined,
    city,
    state,
    zip,
    country,
  };
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function createCartSnapshot(
  items: Array<{
    quantity: number;
    merchantProductId: string | null;
    merchantProduct?: { price: number } | null;
    product?: { price: number | null } | null;
  }>
): CartSnapshot {
  const normalized = items.map((item) => {
    const unitPrice = item.merchantProduct?.price ?? item.product?.price ?? 0;
    const cents = Math.round(unitPrice * 100);
    return {
      key: item.merchantProductId ?? `legacy:${cents}`,
      quantity: item.quantity,
      cents,
      merchantProductId: item.merchantProductId,
    };
  });

  normalized.sort((a, b) => {
    const byKey = a.key.localeCompare(b.key);
    if (byKey !== 0) return byKey;
    return a.quantity - b.quantity;
  });

  const signature = normalized
    .map((item) => `${item.key}:${item.quantity}:${item.cents}`)
    .join("|");
  const hash = crypto.createHash("sha256").update(signature).digest("hex");
  const subtotalCents = normalized.reduce(
    (sum, item) => sum + item.quantity * item.cents,
    0
  );

  return {
    hash,
    subtotalCents,
    hasLegacyItems: normalized.some((item) => !item.merchantProductId),
  };
}

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
    const action = String(body?.action ?? "");

    if (action === "create-intent") {
      return handleCreateIntent(user, body);
    }
    if (action === "confirm") {
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

async function handleCreateIntent(
  user: { id: string; email: string },
  body: {
    address: unknown;
    shippingOption: unknown;
  }
) {
  const checkoutAddress = normalizeCheckoutAddress(body.address);
  const shippingAddress = normalizeAddress(body.address);
  const shippingOptionName = normalizeShippingOptionName(body.shippingOption);
  if (!checkoutAddress || !shippingAddress || !shippingOptionName) {
    return NextResponse.json(
      { error: "Address and shipping option are required" },
      { status: 400 }
    );
  }

  const { cart } = await getOrCreateCart();
  if (!cart.items.length) {
    return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  }

  const snapshot = createCartSnapshot(cart.items);
  if (snapshot.hasLegacyItems) {
    return NextResponse.json(
      {
        error:
          "Your cart contains unsupported legacy products. Please remove them and try again.",
      },
      { status: 400 }
    );
  }

  const rates = await calculateShippingRatesForCart(
    cart.items.map((item) => ({
      merchantProductId: item.merchantProductId,
      quantity: item.quantity,
    })),
    shippingAddress
  );

  const selectedRate = rates.find((rate) => rate.name === shippingOptionName);
  if (!selectedRate) {
    return NextResponse.json(
      { error: "Selected shipping option is no longer available" },
      { status: 400 }
    );
  }

  const shippingCents = Math.round(selectedRate.price * 100);
  const totalCents = snapshot.subtotalCents + shippingCents;
  if (totalCents < 50) {
    return NextResponse.json({ error: "Order total is too low" }, { status: 400 });
  }

  const transferGroup = `checkout_${crypto.randomUUID()}`;
  const paymentIntent = await createMarketplacePaymentIntent({
    amountCents: totalCents,
    currency: "eur",
    transferGroup,
    metadata: {
      userId: user.id,
      cartId: cart.id,
      cartHash: snapshot.hash,
      subtotalCents: String(snapshot.subtotalCents),
      shippingCents: String(shippingCents),
      totalCents: String(totalCents),
      shippingName: selectedRate.name,
      buyerEmail: user.email,
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    transferGroup,
    subtotal: snapshot.subtotalCents / 100,
    shipping: shippingCents / 100,
    total: totalCents / 100,
    shippingOption: selectedRate,
  });
}

async function handleConfirm(
  user: { id: string; email: string },
  body: {
    paymentIntentId: unknown;
    address: unknown;
  }
) {
  const paymentIntentId = String(body.paymentIntentId ?? "").trim();
  const address = normalizeCheckoutAddress(body.address);
  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "Payment intent ID is required" },
      { status: 400 }
    );
  }
  if (!address) {
    return NextResponse.json(
      { error: "Complete shipping address is required" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== "succeeded") {
    return NextResponse.json(
      { error: "Payment has not been completed" },
      { status: 400 }
    );
  }
  if (paymentIntent.currency.toLowerCase() !== "eur") {
    return NextResponse.json(
      { error: "Unexpected payment currency" },
      { status: 400 }
    );
  }

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

  const metadata = paymentIntent.metadata ?? {};
  if (metadata.userId !== user.id) {
    return NextResponse.json(
      { error: "Payment intent does not belong to this user" },
      { status: 403 }
    );
  }

  const expectedSubtotalCents = parsePositiveInt(metadata.subtotalCents);
  const expectedShippingCents = parsePositiveInt(metadata.shippingCents);
  const expectedTotalCents = parsePositiveInt(metadata.totalCents);
  const expectedCartHash = metadata.cartHash;
  const shippingName = (metadata.shippingName || "Shipping").slice(0, 100);

  if (
    expectedSubtotalCents === null ||
    expectedShippingCents === null ||
    expectedTotalCents === null ||
    !expectedCartHash
  ) {
    return NextResponse.json(
      { error: "Missing payment metadata. Please try checkout again." },
      { status: 400 }
    );
  }

  const chargedCents = paymentIntent.amount_received || paymentIntent.amount;
  if (chargedCents !== expectedTotalCents) {
    return NextResponse.json(
      { error: "Payment amount mismatch. Please contact support." },
      { status: 400 }
    );
  }

  const { cart } = await getOrCreateCart();
  if (!cart.items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const snapshot = createCartSnapshot(cart.items);
  if (snapshot.hasLegacyItems) {
    return NextResponse.json(
      {
        error:
          "Your cart contains unsupported legacy products. Please remove them and try again.",
      },
      { status: 400 }
    );
  }
  if (
    snapshot.hash !== expectedCartHash ||
    snapshot.subtotalCents !== expectedSubtotalCents
  ) {
    return NextResponse.json(
      { error: "Your cart changed during checkout. Please try again." },
      { status: 409 }
    );
  }

  const merchantProductIds = cart.items.map((item) => item.merchantProductId as string);
  const merchantProducts = await prisma.merchantProduct.findMany({
    where: { id: { in: merchantProductIds } },
    include: {
      merchant: {
        select: {
          id: true,
          userId: true,
          shopifyDomain: true,
          shopifyAccessToken: true,
          stripeConnectAccountId: true,
          stripeConnectOnboarded: true,
        },
      },
    },
  });
  const merchantProductMap = new Map(merchantProducts.map((mp) => [mp.id, mp]));

  type GroupItem = {
    cartItem: (typeof cart.items)[number];
    merchantProduct: (typeof merchantProducts)[number];
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
    const mp = merchantProductMap.get(item.merchantProductId as string);
    if (!mp) {
      return NextResponse.json(
        { error: "One or more cart items are unavailable." },
        { status: 400 }
      );
    }

    if (!merchantGroups.has(mp.merchant.id)) {
      merchantGroups.set(mp.merchant.id, {
        merchantId: mp.merchant.id,
        merchantUserId: mp.merchant.userId,
        domain: mp.merchant.shopifyDomain,
        accessToken: mp.merchant.shopifyAccessToken,
        stripeConnectAccountId: mp.merchant.stripeConnectAccountId ?? null,
        stripeConnectOnboarded: mp.merchant.stripeConnectOnboarded ?? false,
        items: [],
        subtotal: 0,
      });
    }

    const group = merchantGroups.get(mp.merchant.id)!;
    group.items.push({ cartItem: item, merchantProduct: mp });
    group.subtotal += mp.price * item.quantity;
  }

  const shippingCost = expectedShippingCents / 100;
  const total = expectedTotalCents / 100;
  const overallSubtotal = Array.from(merchantGroups.values()).reduce(
    (sum, group) => sum + group.subtotal,
    0
  );
  const shippingPerMerchant = (merchantId: string) => {
    if (overallSubtotal === 0) return 0;
    const group = merchantGroups.get(merchantId)!;
    return (group.subtotal / overallSubtotal) * shippingCost;
  };

  const checkout =
    existingCheckout ??
    (await prisma.checkout.create({
      data: {
        stripePaymentIntentId: paymentIntentId,
        buyerUserId: user.id,
        buyerEmail: user.email,
        total,
      },
    }));

  const createdOrders: { id: string; orderNumber: string }[] = [];
  let primaryOrderId = "";
  let primaryOrderNumber = "";
  const transferGroup = paymentIntent.transfer_group ?? `checkout_${paymentIntentId}`;
  const shippingAddressJson = {
    line1: address.address1,
    line2: address.address2 ?? "",
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,
  };

  for (const [merchantId, group] of Array.from(merchantGroups.entries())) {
    const merchantShipping = shippingPerMerchant(merchantId);
    const fees = calculateFeeSplit(group.subtotal, merchantShipping);
    const creatorId = group.merchantUserId || null;

    let stripeTransferId: string | undefined;
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
      }
    }

    const order = await prisma.order.create({
      data: {
        buyerEmail: user.email,
        buyerName: `${address.firstName} ${address.lastName}`,
        buyerUserId: user.id,
        shippingAddress: shippingAddressJson,
        merchantId,
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
          create: group.items.map((gi) => ({
            merchantProductId: gi.merchantProduct.id,
            quantity: gi.cartItem.quantity,
            unitPrice: gi.merchantProduct.price,
            total: gi.merchantProduct.price * gi.cartItem.quantity,
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

    createdOrders.push({ id: order.id, orderNumber: order.orderNumber });
    if (createdOrders.length === 1) {
      primaryOrderId = order.id;
      primaryOrderNumber = order.orderNumber;
    }

    if (group.domain && group.accessToken) {
      try {
        const shopifyLineItems = group.items.map((gi) => {
          const variantId = gi.merchantProduct.shopifyVariantId
            ? parseInt(gi.merchantProduct.shopifyVariantId, 10)
            : parseInt(gi.merchantProduct.shopifyProductId, 10);
          return {
            variant_id: variantId,
            quantity: gi.cartItem.quantity,
            price: gi.merchantProduct.price.toFixed(2),
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
            title: shippingName,
            price: merchantShipping.toFixed(2),
          },
          note: `Scrollr order ${primaryOrderNumber}`,
          tags: ["scrollr"],
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { shopifyOrderId: shopifyOrder.id.toString() },
        });
      } catch (err) {
        console.error(
          `Failed to create Shopify order for merchant ${merchantId}:`,
          err
        );
      }
    }
  }

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return NextResponse.json({
    orderId: primaryOrderId,
    orderNumber: primaryOrderNumber,
    totalOrders: createdOrders.length,
  });
}
