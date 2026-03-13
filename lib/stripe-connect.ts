import { getStripe } from "./stripe";
import type Stripe from "stripe";

const PLATFORM_FEE_PERCENT = 1; // 1% to Scrollr
const CREATOR_COMMISSION_PERCENT = 3; // 3% to creator

/**
 * Create a Stripe Connect Express account for a merchant or creator.
 * Returns the account ID.
 */
export async function createConnectAccount(
  email: string,
  type: "merchant" | "creator"
): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
      ...(type === "merchant" ? { card_payments: { requested: true } } : {}),
    },
    metadata: { role: type },
  });
  return account.id;
}

/**
 * Generate an onboarding link for a Connect account.
 */
export async function createOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });
  return link.url;
}

/**
 * Check if a Connect account has completed onboarding.
 */
export async function isAccountOnboarded(accountId: string): Promise<boolean> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  return account.details_submitted === true && account.charges_enabled === true;
}

/**
 * Create a Stripe Connect login link for an existing account (dashboard access).
 */
export async function createDashboardLink(accountId: string): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

/**
 * Calculate fee split for a given order total.
 */
export function calculateFeeSplit(subtotal: number, shippingCost: number) {
  const productTotal = subtotal;
  const platformFee = Math.round(productTotal * PLATFORM_FEE_PERCENT) / 100;
  const creatorCommission =
    Math.round(productTotal * CREATOR_COMMISSION_PERCENT) / 100;
  const total = subtotal + shippingCost;
  const merchantPayout = total - platformFee - creatorCommission;

  return {
    subtotal,
    shippingCost,
    total,
    platformFee,
    creatorCommission,
    merchantPayout,
  };
}

/**
 * Create a PaymentIntent with automatic split to merchant, creator gets a
 * separate transfer after payment succeeds.
 *
 * Scrollr is the platform — money flows through us, then out to merchant + creator.
 */
export async function createCheckoutPayment({
  amountCents,
  merchantStripeId,
  merchantPayoutCents,
  currency = "usd",
  metadata,
}: {
  amountCents: number;
  merchantStripeId: string;
  merchantPayoutCents: number;
  currency?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    // The application_fee_amount is everything that stays on the platform
    // (platform fee + creator commission). Creator gets transferred separately.
    application_fee_amount: amountCents - merchantPayoutCents,
    transfer_data: {
      destination: merchantStripeId,
    },
    metadata: metadata ?? {},
    automatic_payment_methods: { enabled: true },
  });

  return paymentIntent;
}

/**
 * Transfer creator commission after a successful payment.
 */
export async function transferCreatorCommission({
  amountCents,
  creatorStripeId,
  orderId,
}: {
  amountCents: number;
  creatorStripeId: string;
  orderId: string;
}): Promise<Stripe.Transfer> {
  const stripe = getStripe();

  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: "usd",
    destination: creatorStripeId,
    metadata: { orderId, type: "creator_commission" },
  });

  return transfer;
}
