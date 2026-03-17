# Payment System

Scrollr uses Stripe Connect for marketplace payments, enabling split payouts between merchants and the platform.

All prices and transactions use **EUR** (Euro) globally.

## Revenue Split

| Party | Percentage | Description |
|-------|-----------|-------------|
| Merchant | 85% | Product seller |
| Scrollr | 10% | Platform fee |
| Creator | 5% | Commission on sales driven by creator content |
| Stripe | ~2% | Payment processing fee (separate) |

## Checkout Flows

### Standard Cart Checkout

1. Customer adds products to cart (may span multiple merchants)
2. Customer enters shipping address
3. Shipping rates are fetched from each merchant's Shopify store
4. A single Stripe PaymentIntent is created for the total (in EUR)
5. On successful payment:
   - A `Checkout` record is created
   - Separate `Order` records are created per merchant
   - Shopify orders are created on each merchant's store
   - Commissions are calculated and recorded
   - Stripe transfers are initiated to merchant and creator accounts

### Quick Checkout (Buy Now)

Single-product in-feed checkout for impulse purchases:

1. Customer taps "Buy Now" on a product in the feed
2. `POST /api/checkout/quick` creates a Stripe PaymentIntent for the single product
3. If the user has a `stripeCustomerId`, Stripe Link pre-fills payment details
4. On successful payment, an order is created and the merchant is paid

API: `POST /api/checkout/quick`

## Stripe Connect

### Merchant Onboarding
Merchants connect their Stripe account during onboarding:
1. `stripeConnectAccountId` is created via Stripe API
2. Merchant completes Stripe's onboarding flow
3. `stripeConnectOnboarded` is set to `true`

### Payouts

**Merchant payouts** happen immediately at checkout:
- Merchant receives their 85% share via Stripe Connect transfer right after payment

**Creator payouts** are delayed for refund protection:
- Creator commissions (5%) are created with a **30-day hold** (`payableAt` field)
- A weekly cron job (`/api/cron/payouts`) processes eligible commissions:
  1. Finds all PENDING CREATOR_SALE commissions where `payableAt <= now`
  2. Verifies the order hasn't been refunded/cancelled
  3. Groups commissions by creator
  4. Creates a `CreatorPayout` record
  5. Transfers funds via Stripe Connect to the creator's account
  6. Marks commissions as PAID
- If the creator hasn't completed Stripe onboarding, their payout is deferred to the next cycle
- Failed payouts leave commissions as PENDING for automatic retry next week

**Platform fee** is retained by Scrollr's Stripe account (never transferred out)

### Stripe Customer

- A `stripeCustomerId` is stored on the `User` model to support Stripe Link (one-click checkout for returning customers)
- The `getOrCreateStripeCustomer(userId)` utility in `lib/stripe-customer.ts` lazily creates a Stripe Customer on first checkout and persists the ID
- `createMarketplacePaymentIntent` accepts optional `customer` and `setupFutureUsage` parameters to enable saved payment methods

### Commission Tracking

```
Commission {
  orderId    → Links to the sale
  userId     → Creator who earned it
  amount     → EUR amount
  type       → CREATOR_SALE (5%) or PLATFORM_FEE (10%)
  status     → PENDING | PAID | FAILED
  payableAt  → Date when eligible for payout (30-day hold for CREATOR_SALE)
  payoutId   → Links to CreatorPayout when paid
}
```

### Creator Payout Model

```
CreatorPayout {
  userId          → Creator receiving payout
  amount          → Total EUR amount
  stripeTransferId → Stripe transfer reference
  status          → PENDING | PROCESSING | COMPLETED | FAILED
  scheduledFor    → When the payout was executed
  processedAt     → When the transfer completed
  commissions[]   → Commissions included in this payout
}
```

### Refund Flow

Scrollr owns the refund process since payments go through Scrollr's Stripe account:

1. Merchant initiates refund via `POST /api/refunds`
2. Stripe PaymentIntent is refunded with `reverse_transfer: true` (reverses merchant transfer)
3. If creator commission was already paid out, the creator's Stripe transfer is reversed
4. If creator commission is still PENDING (within 30-day hold), it's marked FAILED (no transfer to reverse)
5. Order status → REFUNDED, all commissions → FAILED

This is why creator payouts have a 30-day hold — most merchants have a 14-day refund window, and the extra buffer covers edge cases.

## Implementation Files

- `lib/stripe-connect.ts` — Stripe Connect helpers (`createMarketplacePaymentIntent`, `transferCreatorCommission`, `refundPayment`)
- `lib/stripe-customer.ts` — Stripe Customer ID management (`getOrCreateStripeCustomer`)
- `app/api/checkout/route.ts` — Standard cart checkout (creates orders + commissions with 30-day hold)
- `app/api/checkout/quick/route.ts` — Quick checkout (Buy Now) for single products
- `app/api/cron/payouts/route.ts` — Weekly cron job for processing creator payouts
- `app/api/refunds/route.ts` — Refund processing (reverses merchant + creator transfers)
- `app/api/earnings/route.ts` — Creator earnings dashboard (pending, ready, paid, payout history)
- `app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `stores/cartStore.ts` — Client-side cart state

## Guest Checkout

Scrollr supports guest checkout — no account required to purchase:
- Cart is session-based (cookie), works for both authenticated and guest users
- Guests enter their email at checkout for order confirmation
- Orders are created with `buyerEmail` only (no `buyerUserId`)
- Guest checkout page is at `/checkout` (public route)
- "Already have an account? Sign in" link available for returning users
- After purchase, guests can optionally create an account

## Multi-Merchant Cart

The cart supports items from multiple merchants in a single checkout:
- Items are grouped by merchant with clear merchant labels
- "Ships separately" indicator per merchant group in cart
- Separate shipping rates per merchant
- Shipping estimates shown in product detail modal
- Single payment, multiple orders
- Atomic: all orders succeed or none do
