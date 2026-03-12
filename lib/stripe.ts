import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

export function getPriceIdForPlan(plan: "CREATOR" | "PRO"): string {
  if (plan === "CREATOR") return process.env.STRIPE_PRICE_ID_CREATOR!;
  return process.env.STRIPE_PRICE_ID_PRO!;
}
