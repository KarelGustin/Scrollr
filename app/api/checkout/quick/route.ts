import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateFeeSplit, createMarketplacePaymentIntent, createMerchantTransfer } from "@/lib/stripe-connect";
import { getOrCreateStripeCustomer } from "@/lib/stripe-customer";
import { createOrder as createShopifyOrder } from "@/lib/shopify";
import crypto from "node:crypto";

/**
 * POST /api/checkout/quick
 * Simplified single-product checkout for Buy Now flow.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const {
      merchantProductId,
      selectedSize,
      email,
      name: buyerName,
      shippingAddress,
      videoId,
    } = body;

    if (!merchantProductId || !email || !buyerName || !shippingAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate product
    const merchantProduct = await prisma.merchantProduct.findUnique({
      where: { id: merchantProductId },
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

    if (!merchantProduct || !merchantProduct.available) {
      return NextResponse.json({ error: "Product not available" }, { status: 404 });
    }

    const subtotal = merchantProduct.price;
    const shippingCost = 4.99;
    const fees = calculateFeeSplit(subtotal, shippingCost);

    const totalCents = Math.round(fees.total * 100);
    if (totalCents < 50) {
      return NextResponse.json({ error: "Order total is too low" }, { status: 400 });
    }

    // Get or create Stripe Customer for Stripe Link support
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    const transferGroup = `quick_${crypto.randomUUID()}`;
    const paymentIntent = await createMarketplacePaymentIntent({
      amountCents: totalCents,
      currency: "eur",
      transferGroup,
      metadata: {
        userId: user.id,
        merchantProductId,
        type: "quick_checkout",
        buyerEmail: email,
      },
      customer: customerId,
      setupFutureUsage: "on_session",
    });

    // Create Order + OrderItems
    const shippingAddressJson = {
      line1: shippingAddress.line1 || "",
      line2: shippingAddress.line2 || "",
      city: shippingAddress.city || "",
      state: shippingAddress.state || "",
      zip: shippingAddress.zip || "",
      country: shippingAddress.country || "DE",
    };

    const checkout = await prisma.checkout.create({
      data: {
        stripePaymentIntentId: paymentIntent.id,
        buyerUserId: user.id,
        buyerEmail: email,
        total: fees.total,
      },
    });

    // Transfer to merchant if connected
    let stripeTransferId: string | undefined;
    const merchant = merchantProduct.merchant;
    if (merchant.stripeConnectAccountId && merchant.stripeConnectOnboarded) {
      try {
        const transfer = await createMerchantTransfer({
          amountCents: Math.round(fees.merchantPayout * 100),
          currency: "eur",
          destinationAccountId: merchant.stripeConnectAccountId,
          transferGroup,
          metadata: { merchantId: merchant.id },
        });
        stripeTransferId = transfer.id;
      } catch (err) {
        console.error("Quick checkout merchant transfer failed:", err);
      }
    }

    // Look up creator attribution from video
    let creatorId: string | undefined;
    if (videoId) {
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { userId: true },
      });
      // Don't attribute commission if creator IS the merchant
      if (video && video.userId !== merchant.userId) {
        creatorId = video.userId;
      }
    }

    const payableAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30-day hold

    // Build commission records
    const commissionRecords: Array<{
      userId: string;
      amount: number;
      currency: string;
      type: "PLATFORM_FEE" | "CREATOR_SALE";
      status: "PENDING";
      payableAt: Date | null;
    }> = [
      {
        userId: merchant.userId,
        amount: fees.platformFee,
        currency: "EUR",
        type: "PLATFORM_FEE",
        status: "PENDING",
        payableAt: null,
      },
    ];

    if (creatorId && fees.creatorCommission > 0) {
      commissionRecords.push({
        userId: creatorId,
        amount: fees.creatorCommission,
        currency: "EUR",
        type: "CREATOR_SALE",
        status: "PENDING",
        payableAt,
      });
    }

    const order = await prisma.order.create({
      data: {
        buyerEmail: email,
        buyerName,
        buyerUserId: user.id,
        shippingAddress: shippingAddressJson,
        merchantId: merchant.id,
        creatorId,
        videoId: videoId ?? undefined,
        checkoutId: checkout.id,
        subtotal,
        shippingCost,
        total: fees.total,
        platformFee: fees.platformFee,
        creatorCommission: fees.creatorCommission,
        currency: "EUR",
        stripePaymentId: paymentIntent.id,
        stripeTransferId,
        status: "PAID",
        items: {
          create: [{
            merchantProductId: merchantProduct.id,
            quantity: 1,
            unitPrice: merchantProduct.price,
            total: merchantProduct.price,
          }],
        },
        commissions: {
          create: commissionRecords,
        },
      },
    });

    // Create Shopify order (fire-and-forget)
    if (merchant.shopifyDomain && merchant.shopifyAccessToken) {
      const variantId = merchantProduct.shopifyVariantId
        ? parseInt(merchantProduct.shopifyVariantId, 10)
        : parseInt(merchantProduct.shopifyProductId, 10);

      createShopifyOrder({
        domain: merchant.shopifyDomain,
        accessToken: merchant.shopifyAccessToken,
        lineItems: [{
          variant_id: variantId,
          quantity: 1,
          price: merchantProduct.price.toFixed(2),
        }],
        shippingAddress: {
          first_name: buyerName.split(" ")[0] || buyerName,
          last_name: buyerName.split(" ").slice(1).join(" ") || "",
          address1: shippingAddress.line1,
          city: shippingAddress.city,
          province: shippingAddress.state || "",
          zip: shippingAddress.zip,
          country: shippingAddress.country || "DE",
        },
        email,
        shippingLine: { title: "Standard Shipping", price: shippingCost.toFixed(2) },
        note: `Scrollr quick order ${order.orderNumber}`,
        tags: ["scrollr", "quick-checkout"],
      }).then((shopifyOrder) => {
        prisma.order.update({
          where: { id: order.id },
          data: { shopifyOrderId: shopifyOrder.id.toString() },
        }).catch(() => {});
      }).catch((err) => {
        console.error("Quick checkout Shopify order failed:", err);
      });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Quick checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
