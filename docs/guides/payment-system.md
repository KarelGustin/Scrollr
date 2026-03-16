# Payment System

Scrollr uses Stripe Connect for marketplace payments, enabling split payouts between merchants, creators, and the platform.

## Revenue Split

| Party | Percentage | Description |
|-------|-----------|-------------|
| Merchant | ~85% | Product seller (after Stripe fees) |
| Scrollr | 10% | Platform fee |
| Creator | 3% | Commission on attributed sales |
| Stripe | ~2% | Payment processing fee |

## Checkout Flow

1. Customer adds products to cart (may span multiple merchants)
2. Customer enters shipping address
3. Shipping rates are fetched from each merchant's Shopify store
4. A single Stripe PaymentIntent is created for the total
5. On successful payment:
   - A `Checkout` record is created
   - Separate `Order` records are created per merchant
   - Shopify orders are created on each merchant's store
   - Commissions are calculated and recorded
   - Stripe transfers are initiated to merchant and creator accounts

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

### Commission Tracking

```
Commission {
  orderId    → Links to the sale
  userId     → Creator who earned it
  amount     → Dollar amount
  type       → CREATOR_SALE (3%) or PLATFORM_FEE (1%)
  status     → PENDING | PAID | FAILED
}
```

## Implementation Files

- `lib/stripe-connect.ts` — Stripe Connect helpers
- `app/api/stripe/checkout/route.ts` — Checkout session
- `app/api/webhooks/stripe/route.ts` — Stripe webhook handler
- `stores/cartStore.ts` — Client-side cart state

## Multi-Merchant Cart

The cart supports items from multiple merchants in a single checkout:
- Items are grouped by merchant
- Separate shipping rates per merchant
- Single payment, multiple orders
- Atomic: all orders succeed or none do
