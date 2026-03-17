# Database Schema

All models are defined in `prisma/schema.prisma`. The database is PostgreSQL accessed via Prisma ORM.

## Entity Relationship Overview

```
User ─────┬──── Video ──── VideoProduct ──── MerchantProduct ──── Merchant
          │       │                                │                  │
          │       ├── Report                       │                  │
          │       ├── ModerationLog                │                  │
          │       └── VideoScore                   │                  │
          │                                        │                  │
          ├──── Follow                        CartItem              Order
          ├──── SavedItem                         │                  │
          ├──── Commission ── CreatorPayout   Cart          OrderItem
          ├──── Subscription                      │
          ├──── CreatorApplication           Checkout
          ├──── CreatorTarget
          └──── AdminMessage
```

## Core Models

### User
Primary user account. Links to all user-generated content and actions.
- Fields: `id`, `email`, `username`, `name`, `avatarUrl`, `bio`, `role`, `trustLevel`, `strikeCount`, `bannedUntil`, `stripeCustomerId`
- `stripeCustomerId` (String?, unique) — Stripe Customer ID for Stripe Link support and saved payment methods
- Relations: videos, products, orders, commissions, follows, saved items

### Video
Short-form video content uploaded by creators.
- Fields: `id`, `userId`, `cloudflareStreamId`, `hlsUrl`, `dashUrl`, `thumbnailUrl`, `duration`, `status`, `published`, `title`, `description`, `category`
- Status lifecycle: PROCESSING -> READY | PENDING_REVIEW | REJECTED | ERROR

### Merchant
Store owner who sells products on the platform. Supports Shopify, CSV import, and WooCommerce stores.
- Fields: `id`, `userId`, `shopifyDomain?`, `shopifyAccessToken?`, `storeType`, `storeName`, `slug`, `storeDescription`, `storeTheme`, `stripeConnectAccountId`, `active`, `syncStatus`
- `storeType` (String, default "shopify") — Store platform: "shopify", "csv", or "woocommerce"
- `shopifyDomain` and `shopifyAccessToken` are nullable (null for CSV-only stores)
- `shippingRateStandard`, `shippingRateExpress`, `shippingDaysMin`, `shippingDaysMax` — Shipping config for non-Shopify stores
- `notificationEmail` — Email for order notifications (non-Shopify merchants)
- `syncStatus` (String, default "IDLE") — Tracks product sync progress. Values: IDLE, SYNCING, COMPLETE, FAILED
- Relations: merchantProducts, orders

### MerchantProduct
Product synced from a merchant's Shopify store.
- Fields: `id`, `merchantId`, `shopifyProductId`, `title`, `price`, `imageUrl`, `inventoryQuantity`, `available`, `productType`, `vendor`, `tags`
- Can be linked to a `Product` for video tagging

### Order
Purchase record linking buyer, merchant, and creator.
- Fields: `id`, `orderNumber`, `buyerEmail`, `merchantId`, `creatorId`, `videoId`, `subtotal`, `shippingCost`, `total`, `platformFee`, `creatorCommission`, `status`
- `creatorId` — Creator whose video drove the sale (set from cart item's `videoId` attribution)
- `videoId` — The video that led to the purchase
- Status: PENDING -> PAID -> FULFILLED -> SHIPPED -> DELIVERED | CANCELLED | REFUNDED

### Commission
Tracks creator earnings and platform fees per order.
- Fields: `id`, `orderId`, `userId`, `amount`, `currency`, `type`, `status`, `payableAt`, `payoutId`, `paidAt`, `stripeTransferId`
- `payableAt` — Date when CREATOR_SALE commissions become eligible for payout (30 days after order)
- `payoutId` — Links to `CreatorPayout` when the commission has been paid out
- Status lifecycle: PENDING → PAID (via weekly cron) or FAILED (if order refunded)

### CreatorPayout
Scheduled payout to a creator, grouping one or more commissions.
- Fields: `id`, `userId`, `amount`, `currency`, `stripeTransferId`, `status`, `scheduledFor`, `processedAt`, `failureReason`
- Created by the weekly payout cron job (`/api/cron/payouts`)
- Status: PENDING → PROCESSING → COMPLETED | FAILED

## Enums

| Enum | Values |
|------|--------|
| UserRole | USER, CREATOR, MERCHANT, ADMIN |
| TrustLevel | NEW, BASIC, ESTABLISHED, TRUSTED |
| VideoStatus | PROCESSING, READY, PENDING_REVIEW, REJECTED, ERROR |
| OrderStatus | PENDING, PAID, FULFILLED, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| ReportReason | SEXUAL_CONTENT, VIOLENCE, HATE_SPEECH, SPAM, SCAM, INVOLVES_MINOR, COPYRIGHT, SELF_HARM, OTHER |
| ModerationAction | APPROVED, REJECTED, HIDDEN, RESTORED, USER_WARNED, USER_BANNED |
| CommissionType | CREATOR_SALE (5%), PLATFORM_FEE (10%) |
| CommissionStatus | PENDING, PAID, FAILED |
| PayoutStatus | PENDING, PROCESSING, COMPLETED, FAILED |
| Plan | FREE, CREATOR, PRO |

## Cascade Behavior

- Deleting a **User** cascades to: videos, products, events, follows, saved items, carts, commissions, reports, creator applications, admin messages
- Deleting a **Video** cascades to: video products, events, reports, moderation logs, saved items, video score
- Deleting a **Merchant** cascades to: merchant products
- Deleting a **MerchantProduct** cascades to: video products, cart items, order items (via SetNull for product link)

## Indexes

Performance-critical indexes are defined on:
- `Video(userId, createdAt)` — User's video listing
- `Video(status, published)` — Feed queries
- `VideoScore(score DESC)` — Recommendation ranking
- `Order(merchantId, createdAt)` — Merchant order listing
- `Event(videoId, type)` — Analytics aggregation
- `MerchantProduct(merchantId, available)` — Product listing
- `Commission(userId, status)` — Creator earnings queries
- `Commission(status, payableAt)` — Payout cron eligibility
- `CreatorPayout(userId, status)` — Creator payout history
- `CreatorPayout(status, scheduledFor)` — Payout processing
