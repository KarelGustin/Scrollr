# Payment System

Scrollr uses Stripe Connect for marketplace payments, enabling split payouts between merchants and the platform.

All prices and transactions use **EUR** (Euro) globally.

## Revenue Split

| Party | Percentage | Description |
|-------|-----------|-------------|
| Merchant | 85% | Product seller |
| Scrollr | 15% | Platform fee |
| Creator | 0% | No independent creator commissions |
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
After a successful checkout:
- Merchant receives their share via Stripe Connect transfer
- Creator commission is tracked in the `Commission` table
- Platform fee is retained by Scrollr's Stripe account

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
  type       → CREATOR_SALE (3%) or PLATFORM_FEE (1%)
  status     → PENDING | PAID | FAILED
}
```

## Implementation Files

- `lib/stripe-connect.ts` — Stripe Connect helpers (`createMarketplacePaymentIntent` with optional `customer` and `setupFutureUsage` params)
- `lib/stripe-customer.ts` — Stripe Customer ID management (`getOrCreateStripeCustomer`)
- `app/api/stripe/checkout/route.ts` — Standard cart checkout session
- `app/api/checkout/quick/route.ts` — Quick checkout (Buy Now) for single products
- `app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `stores/cartStore.ts` — Client-side cart state

## Multi-Merchant Cart

The cart supports items from multiple merchants in a single checkout:
- Items are grouped by merchant
- Separate shipping rates per merchant
- Single payment, multiple orders
- Atomic: all orders succeed or none do
