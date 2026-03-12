import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getPriceIdForPlan } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (existingSub?.stripeCustomerId) {
    stripeCustomerId = existingSub.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { userId: session.user.id },
    });
    stripeCustomerId = customer.id;
  }

  const priceId = getPriceIdForPlan(plan);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: {
      userId: session.user.id,
      plan,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
