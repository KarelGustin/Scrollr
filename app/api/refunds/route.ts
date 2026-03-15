import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundPayment } from "@/lib/stripe-connect";
import { getStripe } from "@/lib/stripe";
import { refundOrder as refundShopifyOrder } from "@/lib/shopify";

/**
 * POST: Process a refund request.
 * Body: { orderId: string, reason?: string }
 * Verifies the order belongs to the merchant (current user), then updates statuses.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, reason } = body as { orderId: string; reason?: string };

  if (!orderId) {
    return NextResponse.json(
      { error: "orderId is required" },
      { status: 400 }
    );
  }

  // Find the order and verify it belongs to the merchant (current user)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      merchant: {
        select: {
          userId: true,
          shopifyDomain: true,
          shopifyAccessToken: true,
        },
      },
      commissions: true,
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  // Verify the current user owns the merchant account for this order
  if (order.merchant.userId !== user.id) {
    return NextResponse.json(
      { error: "You are not authorized to refund this order" },
      { status: 403 }
    );
  }

  // Check if order is already refunded
  if (order.status === "REFUNDED") {
    return NextResponse.json(
      { error: "Order has already been refunded" },
      { status: 400 }
    );
  }

  // Check if order is in a refundable state
  if (order.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Cannot refund a cancelled order" },
      { status: 400 }
    );
  }

  try {
    if (!order.stripePaymentId) {
      return NextResponse.json(
        { error: "Order is missing Stripe payment reference" },
        { status: 400 }
      );
    }

    // Refund the captured payment.
    await refundPayment({ paymentIntentId: order.stripePaymentId });

    // Best effort: reverse transfer if it was created separately.
    if (order.stripeTransferId) {
      try {
        await getStripe().transfers.createReversal(order.stripeTransferId);
      } catch (error) {
        console.error("Stripe transfer reversal failed:", error);
      }
    }

    // Best effort: issue Shopify refund when the order is mirrored there.
    if (
      order.shopifyOrderId &&
      order.merchant.shopifyDomain &&
      order.merchant.shopifyAccessToken
    ) {
      await refundShopifyOrder({
        domain: order.merchant.shopifyDomain,
        accessToken: order.merchant.shopifyAccessToken,
        orderId: order.shopifyOrderId,
      });
    }

    // Update order status to REFUNDED and set all commissions to FAILED.
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED" },
      }),
      prisma.commission.updateMany({
        where: { orderId },
        data: { status: "FAILED" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      orderId,
      status: "REFUNDED",
      reason: reason ?? null,
    });
  } catch (err) {
    console.error("Refund processing error:", err);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
