import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceIdForPlan } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { plan } = body as { plan: "CREATOR" | "PRO" };

  if (!plan || !["CREATOR", "PRO"].includes(plan)) {
    return NextResponse.json(
      { error: "Invalid plan. Must be CREATOR or PRO" },
      { status: 400 }
    );
  }

  // Get or create Stripe customer
  let stripeCustomerId: string;
  const existingSub = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
  });

  if (existingSub?.stripeCustomerId) {
    stripeCustomerId = existingSub.stripeCustomerId;
  } else {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
  }

  const priceId = getPriceIdForPlan(plan);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: {
      userId: user.id,
      plan,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
