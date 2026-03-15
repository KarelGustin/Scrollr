# Scrollr Marketplace Redesign — Design Spec

## Overview

Transform Scrollr from a direct-checkout model into a full marketplace platform. This covers payment architecture, merchant storefronts, desktop navigation, merchant onboarding, and transactional emails.

## Goals

- Merchants install a Shopify app and have a stunning storefront live immediately — zero friction
- Consumers check out on Scrollr (never leave the platform), money splits automatically via Stripe Connect
- Desktop users get a proper sidebar navigation instead of being stuck with no nav
- All transactional emails come from scrollr.co with a warm, premium aesthetic
- The entire experience must beat 95% of Shopify stores in design quality

---

## Sub-project 1: Marketplace Payment Architecture

### Payment Flow

1. Consumer adds products to cart on Scrollr (can be from multiple merchants)
2. Consumer checks out on Scrollr — enters address + payment via Stripe
3. Stripe Connect processes payment using **Separate Charges and Transfers** pattern:
   - For each merchant in the cart, a transfer is created to their connected account
   - **85%** of merchant's subtotal → merchant's connected Stripe account (minus Stripe fees)
   - **15%** of merchant's subtotal → Scrollr's platform account
   - **3% creator commission** comes out of Scrollr's 15% (so effectively: 85% merchant, 12% Scrollr, 3% creator)
   - Stripe processing fees (~2.9% + 30¢) deducted from the total charge
   - All transfers grouped under a single `transfer_group` for reconciliation
4. After payment succeeds, Scrollr creates an **order** on merchant's Shopify store via Admin API
   - Created via `POST /admin/api/orders.json` with `financial_status: "paid"`
   - Contains: line items (mapped to Shopify variant IDs), quantities, shipping address
   - Tagged with Scrollr attribution
   - Merchant sees it in Shopify admin like any other order
5. Merchant fulfills (ships) from their Shopify admin
6. Shopify fires fulfillment webhook → Scrollr updates order status → consumer sees tracking info

### Stripe Connect Model

- **Type**: Standard Connect (merchants onboard via Stripe-hosted flow)
- **Onboarding**: Separate step in merchant dashboard (not during Shopify app install)
- **Pre-Connect behavior**: Orders can still come in; Scrollr holds merchant's 85% in Connect escrow until they complete Stripe onboarding
- **Dashboard banner**: Persistent amber banner "Connect Stripe to receive payouts" until completed

### Multi-Merchant Cart

- Consumer can buy from multiple merchants in one checkout
- Single Stripe PaymentIntent for the total amount
- Transfers created per-merchant using `transfer_group` to link them
- Each merchant's Order record references the shared `stripePaymentIntentId` (non-unique) plus a unique `stripeTransferId`
- A new `Checkout` model links all orders from a single checkout session for reconciliation
- Separate fulfillment orders created on each merchant's Shopify store
- Each merchant fulfills independently

### Shipping

- Shipping rates fetched **per-merchant** from each merchant's Shopify store during checkout
- Rates summed and displayed to consumer as itemized shipping (e.g., "Nordic Studio: €5, Streetwear Co: €8")
- Each merchant's shipping cost included in their order total for the 85/15 split

### Edge Cases

- **Out of stock after purchase**: Real-time inventory sync via Shopify webhooks. If stock hits 0, product auto-hidden. Race condition → auto-refund via Stripe.
- **Consumer dispute/chargeback**: Stripe Connect handles at platform level. Scrollr can claw back from merchant's connected account if merchant at fault.
- **Merchant uninstalls Shopify app**: `app/uninstalled` webhook → storefront deactivated → pending orders still tracked → existing payouts still processed.
- **Stripe not connected**: Orders accepted, payouts held in escrow until merchant completes Connect onboarding.
- **Refunds**: Admin or merchant can initiate. Refund reverses the 85/15 split — Stripe claws back from merchant's connected account proportionally. Partial refunds supported (e.g., one item in multi-item order). Consumer refund processed via Stripe Refund API. Order status transitions to `REFUNDED` (full) or stays `PAID` with refund metadata (partial).

### Shopify App

**Purpose**: Read-products + write-orders bridge. Merchant's regular Shopify store stays completely untouched.

**OAuth Scopes Required**:
- Read: products, inventory, shop info, shipping zones/rates
- Write: orders (create with `financial_status: "paid"`), order tags (Scrollr attribution), webhook subscriptions

**Does NOT**:
- Create discounts on merchant's store
- Modify pricing
- Touch existing checkout

**Install Flow**:
1. Merchant clicks direct install link (from cold outreach email) or finds app in Shopify App Store
2. Shopify OAuth grants access
3. Products + variants + images sync to Scrollr
4. Merchant account auto-created in Scrollr (Shopify install IS registration)
5. Storefront goes live immediately at `scrollr.co/store/{slug}`
6. Merchant lands on Scrollr dashboard

**Webhooks Registered**:
- `products/create`, `products/update`, `products/delete` — keep product catalog in sync
- `inventory_levels/update` — real-time stock tracking
- `orders/fulfilled` — update order status when merchant ships
- `app/uninstalled` — deactivate storefront

---

## Sub-project 2: Merchant Storefront

### URL Structure

`scrollr.co/store/{brandslug}` — subdirectory model. Better for SEO (all domain authority on scrollr.co), simpler infrastructure, scales fine.

### Design Direction: Adaptive Theme

Same clean layout structure, but merchants choose **light** or **dark** theme in their storefront settings.

- **Light mode**: Warm white (#FAFAF8) background, dark text, subtle borders. For beauty, lifestyle, fashion.
- **Dark mode**: Dark (#111) background, white text, accent color pops. For streetwear, tech, sneakers.
- Default: light mode.

### Store Page Layout

Top to bottom:
1. **Brand header** — logo (circle or rounded square), brand name, short description
2. **Category chips** — horizontal scrolling pill buttons. "All" selected by default. Filter product grid.
3. **"New" section** — latest products, 2-column grid
4. **"Best Selling" section** — sorted by sales volume, 2-column grid
5. **Product grid** — all products, 2-column grid on mobile, 3-4 columns on desktop

### Product Cards

- 3:4 aspect ratio product image
- Product name (1 line, truncate)
- Price (with strikethrough compare-at-price if on sale)
- Tap → opens product detail modal

### Product Detail Modal (Bottom Sheet)

Slides up from bottom. Structure top to bottom:

1. **Drag handle** — 36px wide, rounded bar
2. **Image carousel** — swipeable, full-width, 1:1 aspect ratio, dot indicators
3. **Brand name** — small uppercase, muted color
4. **Product title** — 18px, bold
5. **Price** — with strikethrough original + discount badge if applicable
6. **Size/variant selection** — chip buttons, selected state with bold border, sold-out sizes crossed out
7. **Add to Cart button** — full width, shows price, 12px border-radius
8. **Collapsible sections** — Description, Sizing & Fit, Shipping & Returns. Collapsed by default.
9. **"See it in action" UGC row** — horizontal scrolling row of best-performing creator videos for this product. Each thumbnail shows creator handle + view count. Tap opens video.

---

## Sub-project 3: Desktop Navigation

### Current Problem

Bottom nav only shows on mobile. Desktop has a basic top header that doesn't provide full navigation. Users get stuck.

### Solution: Labeled Sidebar (Desktop) + Bottom Nav (Mobile)

**Desktop sidebar** (200px wide, left side):
- **Scrollr logo** at top
- **Consumer nav**: Feed, Discover, Orders, Cart
- **Creator section** (if role = CREATOR): Dashboard, My Videos (separated by divider + "Creator" label)
- **Merchant section** (if role = MERCHANT): Overview, Orders, Products, Creators, Analytics, Storefront, Settings
- **User profile** at bottom: avatar, name, username
- Sign Out in profile area

**Behavior**:
- Fixed position, full height
- Desktop only: visible at `md` breakpoint and above (≥768px)
- When sidebar shows, top header bar is removed
- Bottom nav hidden on desktop (`md:hidden`)

**Mobile**: Bottom nav stays as-is (already works well).

---

## Sub-project 4: Merchant Auth + Onboarding

### New Flow (Shopify App Install = Registration)

1. Merchant receives cold outreach with direct Shopify app install link
2. Clicks "Install" → Shopify OAuth flow
3. On callback, Scrollr backend:
   - Creates User record (email from Shopify shop info, role: MERCHANT)
   - Creates Merchant record (linked to user, shopifyDomain, accessToken, etc.)
   - Syncs all products
   - Registers webhooks
   - Sets session/auth cookie
4. Redirects to `/merchant` dashboard
5. Storefront already live at `scrollr.co/store/{slug}`

### Returning Merchants

- Can sign in via normal `/login` with their email
- Redirected to `/merchant` dashboard based on role

### Merchant Dashboard

- **Stripe Connect banner** (amber, persistent until connected): "Connect Stripe to receive payouts" with one-click button that opens Stripe-hosted onboarding
- **Welcome header**: "Good morning, {storeName}" with subtitle
- **Stats row**: Revenue, Orders, Conversion Rate, Active Creators (4 cards)
- **Two-column grid**: Recent Orders (with status badges) + Top Products (with CVR data)
- **Top Performing UGC**: Horizontal scroll of creator videos with CVR overlay — proves Scrollr's value

### Merchant Sidebar Nav

- Overview, Orders, Products, Creators, Analytics, Storefront (theme/logo/bio settings), Settings
- "MERCHANT" badge next to Scrollr logo
- Store info at bottom: logo, name, storefront URL

---

## Sub-project 5: Resend Emails

### Configuration

- **From**: `Scrollr <hello@scrollr.co>` (or `notifications@scrollr.co`)
- **Domain**: scrollr.co (needs DNS verification in Resend)
- **Design**: Warm light aesthetic matching storefront — light background (#FAFAF8), clean typography, coral (#FF6B4A) accents, minimal layout

### Email Templates (9 total)

**Merchant Emails:**

1. **Merchant Welcome** — triggered after Shopify app install
   - Subject: "Your store is live on Scrollr"
   - Content: storefront URL, next steps (connect Stripe, customize storefront), product count synced

2. **Stripe Connect Reminder** — triggered X days after install if Stripe not connected
   - Subject: "Start receiving payouts on Scrollr"
   - Content: explain why Stripe is needed, one-click connect button, show any pending revenue

3. **New Order Notification** — triggered when consumer purchases merchant's product
   - Subject: "New sale on Scrollr — Order #{number}"
   - Content: order details, items, revenue (their 85%), link to Shopify admin to fulfill

**Consumer Emails:**

4. **Email Confirmation** — triggered on signup
   - Subject: "Confirm your email"
   - Content: confirmation link/code, brief Scrollr intro

5. **Welcome to Scrollr** — triggered after email confirmed
   - Subject: "Welcome to Scrollr"
   - Content: what Scrollr is, how to discover products, how to apply as creator

6. **Order Confirmation** — triggered after successful checkout
   - Subject: "Order confirmed — #{number}"
   - Content: items, prices, shipping address, estimated delivery, order tracking link

7. **Order Shipped** — triggered when merchant fulfills order
   - Subject: "Your order has shipped"
   - Content: tracking number, tracking URL, estimated delivery, items

**Creator Emails:**

8. **Application Approved** — triggered when admin approves creator application
   - Subject: "You're in! Start creating on Scrollr"
   - Content: welcome, link to creator dashboard, how to upload first video, how to tag products

9. **Application Rejected** — triggered when admin rejects creator application
   - Subject: "Update on your Scrollr creator application"
   - Content: rejection reason/feedback, option to reapply, what to improve

### Email Design System

All emails share:
- Light background (#FAFAF8)
- White content card with subtle border
- Scrollr logo at top (text, not image — better email client support)
- Coral (#FF6B4A) for primary buttons and links
- Dark text (#1a1a1a) for headings, muted (#888) for secondary
- Max-width 560px, centered
- Footer: unsubscribe link, Scrollr address, social links

---

## Schema Changes Required

### Merchant model — add fields:
- `slug String @unique` — URL-safe store slug for `scrollr.co/store/{slug}`
- `storeDescription String?` — short brand description for storefront header
- `storeTheme String @default("light")` — "light" or "dark"
- `stripeConnectAccountId String?` — Stripe Connect account ID
- `stripeConnectOnboarded Boolean @default(false)` — whether onboarding is complete

### Order model — update fields:
- `stripePaymentIntentId String?` — non-unique, links all orders in a multi-merchant checkout
- Keep `stripePaymentId` as unique for primary reference
- `stripeTransferId String? @unique` — the Stripe Connect transfer for this merchant's portion
- Update commission fields: `platformFee` = 12% of subtotal, `creatorCommission` = 3% of subtotal

### New model — Checkout:
- `id`, `stripePaymentIntentId String @unique`, `buyerUserId`, `total`, `createdAt`
- Relations: orders (one-to-many)

### MerchantProduct model — clarification:
- Each row represents a **specific variant** (one SKU). The `shopifyVariantId` identifies it.
- `selectedSize` on CartItem is redundant since variant selection maps directly to a MerchantProduct row. Remove or repurpose as display-only label.

## Technical Dependencies

- **Stripe Connect**: Need Stripe account upgraded to platform/marketplace. Standard Connect accounts for merchants. Use "Separate Charges and Transfers" pattern for multi-merchant carts.
- **Shopify App**: Need to register as a Shopify Partner and create a custom app (unlisted, direct install link for cold outreach).
- **Resend**: DNS records for scrollr.co (SPF, DKIM, DMARC) to send from new domain.
- **Webhook addition**: Add `products/create` to registered webhooks (currently missing — new products added after initial sync won't be detected).

## Out of Scope

- Shopify App Store public listing (start with direct install links for cold outreach)
- Native mobile app
- Real-time chat between merchants and creators
