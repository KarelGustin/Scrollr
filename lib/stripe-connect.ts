import { getStripe } from "./stripe";
import type Stripe from "stripe";

const PLATFORM_FEE_PERCENT = 10; // 10% to Scrollr
const CREATOR_COMMISSION_PERCENT = 5; // 5% to creator
const MERCHANT_PAYOUT_PERCENT = 85; // 85% to merchant

/**
 * Create a Stripe Connect Standard account for a merchant or creator.
 * Returns the account ID.
 */
export async function createConnectAccount(
  email: string,
  type: "merchant" | "creator"
): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "standard",
    email,
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
 * Splits subtotal into: 85% merchant, 10% platform, 5% creator.
 */
export function calculateFeeSplit(subtotal: number, shippingCost: number) {
  const platformFee = subtotal * (PLATFORM_FEE_PERCENT / 100);
  const creatorCommission = subtotal * (CREATOR_COMMISSION_PERCENT / 100);
  const total = subtotal + shippingCost;
  const merchantPayout = subtotal * (MERCHANT_PAYOUT_PERCENT / 100);
  return { subtotal, shippingCost, total, platformFee, creatorCommission, merchantPayout };
}

/**
 * Create a platform-level PaymentIntent using Separate Charges and Transfers.
 * Money is collected by the platform; transfers to merchant and creator are made separately.
 * Use transfer_group to link all transfers to this payment.
 */
export async function createMarketplacePaymentIntent(params: {
  amountCents: number;
  currency: string;
  transferGroup: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: params.currency,
    transfer_group: params.transferGroup,
    automatic_payment_methods: { enabled: true },
    metadata: params.metadata || {},
  });
}

/**
 * Transfer merchant payout to a Standard Connect account after payment succeeds.
 */
export async function createMerchantTransfer(params: {
  amountCents: number;
  currency: string;
  destinationAccountId: string;
  transferGroup: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Transfer> {
  const stripe = getStripe();
  return stripe.transfers.create({
    amount: params.amountCents,
    currency: params.currency,
    destination: params.destinationAccountId,
    transfer_group: params.transferGroup,
    metadata: params.metadata || {},
  });
}

/**
 * Refund a PaymentIntent, reversing associated transfers.
 */
export async function refundPayment(params: {
  paymentIntentId: string;
  amount?: number;
}): Promise<Stripe.Refund> {
  const stripe = getStripe();
  return stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amount,
    reverse_transfer: true,
  });
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
