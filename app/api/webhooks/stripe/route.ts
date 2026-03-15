import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  markWebhookEventFailure,
  markWebhookEventSuccess,
  startWebhookEvent,
} from "@/lib/webhook-idempotency";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const guard = await startWebhookEvent("STRIPE", event.id);
  if (!guard.shouldProcess) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as "CREATOR" | "PRO" | undefined;

        if (!userId || !plan) break;

        const subscriptionId = session.subscription as string | null;
        const customerId = session.customer as string;

        let stripePriceId: string | null = null;
        let currentPeriodEnd: Date | null = null;
        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          stripePriceId = sub.items.data[0]?.price.id ?? null;
          currentPeriodEnd = new Date(sub.current_period_end * 1000);
        }

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId,
            plan,
            status: "active",
            currentPeriodEnd,
          },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId,
            plan,
            status: "active",
            currentPeriodEnd,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: subscription.status,
              stripePriceId: subscription.items.data[0]?.price.id ?? null,
              currentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: "canceled",
              plan: "FREE",
            },
          });
        }
        break;
      }
    }
  } catch (error) {
    await markWebhookEventFailure(
      guard.recordId,
      error instanceof Error ? error.message : "Stripe webhook failed"
    );
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  await markWebhookEventSuccess(guard.recordId);

  return NextResponse.json({ received: true });
}
