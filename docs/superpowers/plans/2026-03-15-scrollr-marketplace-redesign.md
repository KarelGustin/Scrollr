# Scrollr Marketplace Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Scrollr from a direct-checkout model into a full marketplace platform with Stripe Connect payouts, merchant storefronts, desktop sidebar navigation, streamlined merchant onboarding, and transactional emails.

**Architecture:** Next.js 14 app router with Prisma ORM, Supabase auth, Stripe Connect for marketplace payments, Shopify Admin API for product sync and fulfillment orders, Resend for transactional emails. Consumer-facing app uses a labeled sidebar on desktop and bottom nav on mobile. Merchant storefronts live at `/store/{slug}` with adaptive light/dark themes.

**Tech Stack:** Next.js 14, TypeScript, Prisma, Stripe Connect, Shopify Admin API, Resend, Supabase, Tailwind CSS, Zustand, React Query

**Spec:** `docs/superpowers/specs/2026-03-15-scrollr-marketplace-redesign-design.md`

**Chunk ordering is sequential — each chunk depends on the previous. Do not skip ahead.**

---

## Chunk 1: Schema Updates + Stripe Connect Foundation

### Task 1: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma` (Merchant model ~line 245, Order model ~line 299, User model ~line 11)

- [ ] **Step 1: Add new fields to Merchant model**

In the Merchant model (~line 245), add these fields. Note: `storeLogoUrl` already exists on the model — do NOT duplicate it:

```prisma
model Merchant {
  // ... existing fields (userId, shopifyDomain, shopifyAccessToken, etc.) ...
  // ... storeLogoUrl already exists ...
  slug                    String?   @unique
  storeDescription        String?
  storeTheme              String    @default("light")
  stripeConnectAccountId  String?
  stripeConnectOnboarded  Boolean   @default(false)
  // ... existing relations ...
}
```

Note: `slug` is `String?` (optional) so existing merchants without slugs don't break. The onboarding flow will always set it going forward.

- [ ] **Step 2: Add Checkout model and update Order model**

Add the Checkout model after the Order model. Add `checkoutId` and `stripeTransferId` to Order. Remove `@unique` from `stripePaymentId` (multi-merchant carts share the same PaymentIntent):

```prisma
model Checkout {
  id                    String   @id @default(cuid())
  stripePaymentIntentId String   @unique
  buyerUserId           String?
  buyerEmail            String
  total                 Float
  createdAt             DateTime @default(now())
  orders                Order[]
  buyer                 User?    @relation("UserCheckouts", fields: [buyerUserId], references: [id])
}
```

In Order model, change `stripePaymentId` from `@unique` to plain optional, and add:

```prisma
model Order {
  // ... existing fields ...
  stripePaymentId  String?          // REMOVE @unique — multi-merchant carts share PaymentIntent
  checkoutId       String?
  stripeTransferId String?   @unique
  checkout         Checkout? @relation(fields: [checkoutId], references: [id])
  // ... existing relations ...
}
```

In User model, add the Checkout relation:

```prisma
model User {
  // ... existing fields and relations ...
  checkouts        Checkout[] @relation("UserCheckouts")
}
```

**Important:** Do NOT add `checkouts` to the Merchant model — a Checkout spans multiple merchants.

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name add-marketplace-fields
```

Expected: Migration succeeds. Existing data unaffected (all new fields are optional or have defaults). The `stripePaymentId` unique constraint removal may require a two-step migration if there are existing duplicate values — if so, Prisma will guide you.

- [ ] **Step 4: Verify Prisma client regenerated**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add marketplace schema — Merchant slug/theme/stripe, Checkout model, Order transfer tracking"
```

---

### Task 2: Update Stripe Connect Utilities

**Files:**
- Modify: `lib/stripe-connect.ts` (this file already exists with Express accounts — we're switching to Standard and adding marketplace transfer functions)

**IMPORTANT:** This file already exists at `lib/stripe-connect.ts`. It currently uses:
- `type: "express"` accounts (change to `type: "standard"`)
- `PLATFORM_FEE_PERCENT = 1` (change to `12`)
- `CREATOR_COMMISSION_PERCENT = 3` (keep as-is)
- Direct Charges pattern (`application_fee_amount` + `transfer_data.destination`) — replace with Separate Charges and Transfers pattern (`transfer_group`)
- Existing functions: `createConnectAccount`, `createOnboardingLink`, `isAccountOnboarded`, `createDashboardLink`, `calculateFeeSplit`, `createCheckoutPayment`, `transferCreatorCommission`

- [ ] **Step 1: Update constants and account creation**

```typescript
const PLATFORM_FEE_PERCENT = 12; // 12% to Scrollr (changed from 1%)
const CREATOR_COMMISSION_PERCENT = 3; // 3% to creator (unchanged)
const MERCHANT_PAYOUT_PERCENT = 85; // 85% to merchant
```

Update `createConnectAccount` to use Standard accounts:

```typescript
export async function createConnectAccount(
  email: string,
  type: "merchant" | "creator"
): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "standard",  // Changed from "express"
    email,
    metadata: { role: type },
  });
  return account.id;
}
```

Note: Remove the `capabilities` block — Standard accounts manage their own capabilities.

- [ ] **Step 2: Update `calculateFeeSplit` for 85/12/3**

```typescript
export function calculateFeeSplit(subtotal: number, shippingCost: number) {
  const platformFee = subtotal * (PLATFORM_FEE_PERCENT / 100);
  const creatorCommission = subtotal * (CREATOR_COMMISSION_PERCENT / 100);
  const total = subtotal + shippingCost;
  const merchantPayout = subtotal * (MERCHANT_PAYOUT_PERCENT / 100);

  return {
    subtotal,
    shippingCost,
    total,
    platformFee,
    creatorCommission,
    merchantPayout,
  };
}
```

- [ ] **Step 3: Replace `createCheckoutPayment` with marketplace payment functions**

Remove `createCheckoutPayment` (Direct Charges pattern). Add these two functions (Separate Charges and Transfers pattern):

```typescript
/**
 * Create a PaymentIntent with transfer_group for multi-merchant checkout.
 * No destination — transfers happen separately after payment succeeds.
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
 * Create a transfer to a merchant's connected account after payment succeeds.
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
 * Issue a refund, reversing the transfer proportionally.
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
```

Keep `transferCreatorCommission` as-is — creators still get their 3% via transfer.

- [ ] **Step 4: Commit**

```bash
git add lib/stripe-connect.ts
git commit -m "feat: update Stripe Connect — Standard accounts, 85/12/3 split, Separate Charges and Transfers"
```

---

### Task 3: Update Stripe Connect API Routes

**Files:**
- Modify: `app/api/stripe/connect/route.ts` (already exists — currently handles creator Connect, needs merchant support)

- [ ] **Step 1: Update existing Connect route for merchant support**

The existing `app/api/stripe/connect/route.ts` currently only handles creators (saves to `user.stripeConnectId`, redirects to `/earnings`). Update the POST handler to detect whether the user is a MERCHANT and handle accordingly:

```typescript
export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      role: true,
      stripeConnectId: true,
      stripeConnectOnboarded: true,
      merchant: { select: { id: true, stripeConnectAccountId: true, stripeConnectOnboarded: true } },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isMerchant = dbUser.role === "MERCHANT";

  try {
    // For merchants, use the Merchant model's Stripe fields
    let connectId = isMerchant
      ? dbUser.merchant?.stripeConnectAccountId
      : dbUser.stripeConnectId;

    if (connectId) {
      const onboarded = await isAccountOnboarded(connectId);
      if (onboarded) {
        if (isMerchant && dbUser.merchant && !dbUser.merchant.stripeConnectOnboarded) {
          await prisma.merchant.update({
            where: { id: dbUser.merchant.id },
            data: { stripeConnectOnboarded: true },
          });
        } else if (!isMerchant && !dbUser.stripeConnectOnboarded) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeConnectOnboarded: true },
          });
        }
        return NextResponse.json({ connected: true, onboarded: true });
      }

      const returnPath = isMerchant ? "/merchant?stripe=complete" : "/earnings?stripe=success";
      const refreshPath = isMerchant ? "/merchant?stripe=refresh" : "/earnings?stripe=refresh";
      const url = await createOnboardingLink(connectId, `${APP_URL}${returnPath}`, `${APP_URL}${refreshPath}`);
      return NextResponse.json({ url });
    }

    // Create new Connect account
    connectId = await createConnectAccount(dbUser.email, isMerchant ? "merchant" : "creator");

    if (isMerchant && dbUser.merchant) {
      await prisma.merchant.update({
        where: { id: dbUser.merchant.id },
        data: { stripeConnectAccountId: connectId },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectId: connectId },
      });
    }

    const returnPath = isMerchant ? "/merchant?stripe=complete" : "/earnings?stripe=success";
    const refreshPath = isMerchant ? "/merchant?stripe=refresh" : "/earnings?stripe=refresh";
    const url = await createOnboardingLink(connectId, `${APP_URL}${returnPath}`, `${APP_URL}${refreshPath}`);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Stripe Connect error:", err);
    return NextResponse.json({ error: "Failed to set up Stripe Connect" }, { status: 500 });
  }
}
```

Update GET handler similarly to check merchant fields when `role === "MERCHANT"`.

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/connect/route.ts
git commit -m "feat: update Stripe Connect route to support both merchant and creator onboarding"
```

---

### Task 4: Update Checkout Flow for Marketplace Split

**Files:**
- Modify: `app/api/checkout/route.ts`

This is the most critical change. Replace Direct Charges with Separate Charges and Transfers.

- [ ] **Step 1: Update imports and handleCreateIntent**

At the top of `app/api/checkout/route.ts`, update imports:

```typescript
import { createMarketplacePaymentIntent, createMerchantTransfer, calculateFeeSplit } from "@/lib/stripe-connect";
```

Replace `handleCreateIntent` (~lines 67-132). Key changes:
- Generate a `transferGroup` ID
- Use `createMarketplacePaymentIntent` instead of plain `paymentIntents.create`
- Return `transferGroup` to frontend

```typescript
async function handleCreateIntent(cart: any, email: string, user: any) {
  // ... existing cart loading and total calculation (keep as-is) ...

  const transferGroup = `checkout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const paymentIntent = await createMarketplacePaymentIntent({
    amountCents: Math.round(total * 100),
    currency: "eur",
    transferGroup,
    metadata: {
      cartId: cart.id,
      buyerEmail: email,
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    transferGroup,
    total,
  });
}
```

- [ ] **Step 2: Update handleConfirm for marketplace splits**

Replace the order creation loop in `handleConfirm` (~lines 281-405). Key changes:
- Create a `Checkout` record first
- For each merchant's items, use `calculateFeeSplit` for 85/12/3
- Create `Transfer` to merchant's connected Stripe account
- Create `Order` linked to `Checkout` with `stripeTransferId`

```typescript
// Create Checkout record
const checkout = await prisma.checkout.create({
  data: {
    stripePaymentIntentId: paymentIntentId,
    buyerUserId: user?.id || null,
    buyerEmail: user?.email || email,
    total,
  },
});

// For each merchant group:
for (const [merchantId, items] of Object.entries(merchantGroups)) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { user: { select: { email: true } } },
  });
  const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
  const fees = calculateFeeSplit(subtotal, merchantShipping);

  let stripeTransferId: string | undefined;

  // Transfer to merchant if they have Stripe Connect
  if (merchant?.stripeConnectAccountId && merchant.stripeConnectOnboarded) {
    const transfer = await createMerchantTransfer({
      amountCents: Math.round(fees.merchantPayout * 100),
      currency: "eur",
      destinationAccountId: merchant.stripeConnectAccountId,
      transferGroup,
      metadata: { merchantId },
    });
    stripeTransferId = transfer.id;
  }
  // If merchant hasn't connected Stripe yet, the money stays on Scrollr's
  // account. Once they connect, transfers can be made retroactively.

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      checkoutId: checkout.id,
      merchantId,
      buyerEmail: user?.email || email,
      buyerUserId: user?.id,
      subtotal,
      shippingCost: merchantShipping,
      total: fees.total,
      platformFee: fees.platformFee,
      creatorCommission: fees.creatorCommission,
      stripePaymentId: paymentIntentId,
      stripeTransferId,
      status: "PAID",
      shippingAddress: address,
      // ... items, commissions etc. (keep existing OrderItem creation logic)
    },
  });

  // Create Shopify fulfillment order
  if (merchant?.shopifyAccessToken) {
    await createShopifyOrder(merchant, order, items, address);
  }
}
```

- [ ] **Step 3: Test checkout flow manually**

```bash
npm run dev
```

Test: add items to cart → checkout → verify PaymentIntent has `transfer_group` → verify Checkout + Order records created → verify Shopify order created.

- [ ] **Step 4: Commit**

```bash
git add app/api/checkout/route.ts
git commit -m "feat: update checkout for marketplace — Stripe Connect transfers, 85/12/3 split, Checkout model"
```

---

## Chunk 2: Shopify App + Merchant Onboarding

### Task 5: Add `products/create` Webhook Registration + Handler

**Files:**
- Modify: `lib/shopify.ts` (~line 330, registerWebhooks function)
- Modify: `app/api/webhooks/shopify/route.ts` (existing webhook handler — add products/create case)

- [ ] **Step 1: Add products/create to webhook topics**

In `lib/shopify.ts`, find the `registerWebhooks` function and add `"products/create"` to the topics array:

```typescript
const topics = [
  "products/create",    // NEW
  "products/update",
  "products/delete",
  "inventory_levels/update",
  "orders/fulfilled",
  "app/uninstalled",
];
```

- [ ] **Step 2: Add handler for products/create in webhook route**

In `app/api/webhooks/shopify/route.ts`, add a case for `products/create` that triggers a sync for that specific product. It should follow the same pattern as `products/update` — find the merchant by shopifyDomain, call `syncAllProducts` or a targeted sync function.

- [ ] **Step 3: Commit**

```bash
git add lib/shopify.ts app/api/webhooks/shopify/route.ts
git commit -m "fix: add products/create webhook to detect new products after initial sync"
```

---

### Task 6: Shopify App Install = Merchant Registration

**Files:**
- Modify: `app/api/shopify/callback/route.ts`
- Create: `lib/slug.ts`

- [ ] **Step 1: Create slug utility**

Create `lib/slug.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export function generateSlug(storeName: string): string {
  return storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.merchant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}
```

- [ ] **Step 2: Update Shopify callback to auto-create merchant account**

The existing callback at `app/api/shopify/callback/route.ts` line 17 calls `getUser()` and redirects to login if not authenticated. **Remove this auth check** — the whole point is that Shopify app install IS registration. The merchant should not need to be logged in beforehand.

Replace the GET handler with:

```typescript
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { createClient } from "@supabase/supabase-js";
import { sendMerchantWelcome } from "@/lib/email";

export async function GET(req: NextRequest) {
  // ... existing: validate HMAC, exchange code for accessToken ...
  // ... existing: const { shop, code } = from URL params ...

  const shopInfo = await fetchShopInfo(shop, accessToken);
  const shopEmail = shopInfo.email;

  // Find or create Supabase auth user
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Use getUserByEmail instead of listing all users
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({
    filter: { email: shopEmail },
  });
  let supabaseUser = users?.[0];

  const tempPassword = crypto.randomUUID();
  if (!supabaseUser) {
    const { data } = await supabaseAdmin.auth.admin.createUser({
      email: shopEmail,
      email_confirm: true,
      password: tempPassword,
    });
    supabaseUser = data.user;
  }

  // Find or create Prisma user
  let user = await prisma.user.findUnique({ where: { email: shopEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: shopEmail,
        name: shopInfo.name || shop.replace(".myshopify.com", ""),
        role: "MERCHANT",
      },
    });
  } else if (user.role !== "MERCHANT") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "MERCHANT" },
    });
  }

  const slug = await ensureUniqueSlug(generateSlug(shopInfo.name || shop));

  const merchant = await prisma.merchant.upsert({
    where: { shopifyDomain: shop },
    update: {
      shopifyAccessToken: accessToken,
      storeName: shopInfo.name || shop,
      shopifyShopId: String(shopInfo.id),
    },
    create: {
      userId: user.id,
      shopifyDomain: shop,
      shopifyAccessToken: accessToken,
      shopifyShopId: String(shopInfo.id),
      storeName: shopInfo.name || shop,
      slug,
      storeTheme: "light",
    },
  });

  // Register webhooks + sync products (existing logic)
  await registerWebhooks(shop, accessToken);
  const syncResult = await syncAllProducts(merchant.id, shop, accessToken);

  // Sign the user in by creating a Supabase session
  // Use signInWithPassword with the temp password for new users,
  // or generate a magic link redirect
  const { data: signInData } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: shopEmail,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/merchant` },
  });

  // Send welcome email
  await sendMerchantWelcome(
    shopEmail,
    merchant.storeName || shop,
    merchant.slug || slug,
    syncResult?.synced || 0
  );

  // Redirect to merchant dashboard
  // For the magic link approach, redirect to the verification URL
  // For simplicity, redirect to login with a message
  const redirectUrl = new URL("/merchant", process.env.NEXT_PUBLIC_APP_URL);
  return NextResponse.redirect(redirectUrl);
}
```

**Note on auth session:** The exact session creation method depends on your Supabase setup. Options:
1. `generateLink({ type: "magiclink" })` → redirect through magic link URL (cleanest)
2. Create user with known password → `signInWithPassword` → set cookies on response
3. Redirect to `/login` with a pre-filled email and a flash message

Pick the approach that works with your current Supabase cookie setup. The key requirement: after this redirect, the merchant must be able to access `/merchant` without hitting the auth gate.

- [ ] **Step 3: Commit**

```bash
git add lib/slug.ts app/api/shopify/callback/route.ts
git commit -m "feat: auto-create merchant account on Shopify app install — slug, sync, welcome email"
```

---

### Task 7: Update Middleware for Store API Routes

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Add store API routes to public paths**

The existing middleware already has `/store` in public routes (page routes). But the store product API at `/api/store/...` is NOT public — consumers browsing storefronts without being logged in will get 401s. Add:

```typescript
const publicRoutes = [
  // ... existing routes ...
  "/api/store",      // store product API — public for storefronts
];
```

Also verify `/store` is already in the public routes list (it should be from existing code).

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add /api/store to public middleware paths for storefront access"
```

---

## Chunk 3: Merchant Storefront Pages

### Task 8: Storefront Store Page

**Files:**
- Rename: `app/(public)/store/[merchantId]/` → `app/(public)/store/[slug]/` (existing route uses merchantId — rename to slug)
- Rewrite: `app/(public)/store/[slug]/page.tsx`
- Create: `app/(public)/store/[slug]/StorePageClient.tsx`
- Create: `components/store/StoreHeader.tsx`
- Create: `components/store/CategoryChips.tsx`
- Create: `components/store/ProductGrid.tsx`
- Create: `components/store/ProductCard.tsx`

**IMPORTANT:** The existing store route is at `app/(public)/store/[merchantId]/page.tsx`. Delete this directory and create `app/(public)/store/[slug]/` instead. Having two dynamic segments at the same level will cause a Next.js error.

Also check if the parent `app/(public)/layout.tsx` adds any wrapping UI (header, bottom nav, padding). The store layout sets its own full-page background, so if the parent layout adds chrome, the store should either opt out or the store layout should override it.

- [ ] **Step 1: Delete old store route and create new directory**

```bash
rm -rf app/(public)/store/[merchantId]
mkdir -p "app/(public)/store/[slug]"
```

- [ ] **Step 2: Create store page (server component)**

Create `app/(public)/store/[slug]/page.tsx`:

```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StorePageClient } from "./StorePageClient";

export default async function StorePage({ params }: { params: { slug: string } }) {
  // Use findFirst since we're filtering by slug (unique) + active (non-unique)
  const merchant = await prisma.merchant.findFirst({
    where: { slug: params.slug, active: true },
    include: {
      merchantProducts: {
        where: { available: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!merchant) notFound();

  const isDark = merchant.storeTheme === "dark";

  // Deduplicate products by shopifyProductId (group variants, keep first/cheapest)
  const productMap = new Map<string, any>();
  for (const mp of merchant.merchantProducts) {
    const key = mp.shopifyProductId;
    if (!productMap.has(key)) {
      productMap.set(key, {
        id: mp.id,
        shopifyProductId: mp.shopifyProductId,
        title: mp.title,
        imageUrl: mp.imageUrl,
        // Prisma returns Json fields as parsed objects, NOT strings
        images: (mp.images as string[]) || (mp.imageUrl ? [mp.imageUrl] : []),
        price: mp.price,
        compareAtPrice: mp.compareAtPrice,
        productType: mp.productType,
        tags: mp.tags,
        createdAt: mp.createdAt,
      });
    }
  }

  const products = Array.from(productMap.values());
  const categories = [...new Set(products.map((p: any) => p.productType).filter(Boolean))] as string[];

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#111] text-white" : "bg-[#FAFAF8] text-[#1a1a1a]"}`}>
      <div className="max-w-6xl mx-auto pb-20">
        <StoreHeader
          storeName={merchant.storeName || merchant.shopifyDomain}
          storeDescription={merchant.storeDescription}
          storeLogoUrl={merchant.storeLogoUrl}
          isDark={isDark}
        />
        <StorePageClient
          products={products}
          categories={categories}
          isDark={isDark}
          merchantId={merchant.id}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create StoreHeader component**

Create `components/store/StoreHeader.tsx`:

```typescript
interface StoreHeaderProps {
  storeName: string;
  storeDescription?: string | null;
  storeLogoUrl?: string | null;
  isDark: boolean;
}

export function StoreHeader({ storeName, storeDescription, storeLogoUrl, isDark }: StoreHeaderProps) {
  return (
    <div className="text-center py-8">
      {storeLogoUrl ? (
        <img src={storeLogoUrl} alt={storeName} className="w-12 h-12 rounded-full mx-auto mb-3 object-cover" />
      ) : (
        <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg ${isDark ? "bg-white/20" : "bg-[#222]"}`}>
          {storeName.charAt(0).toUpperCase()}
        </div>
      )}
      <h1 className="text-xl font-bold tracking-wide">{storeName.toUpperCase()}</h1>
      {storeDescription && (
        <p className={`text-sm mt-1 ${isDark ? "text-white/50" : "text-[#999]"}`}>{storeDescription}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create CategoryChips component**

Create `components/store/CategoryChips.tsx`:

```typescript
"use client";

interface CategoryChipsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  isDark: boolean;
}

export function CategoryChips({ categories, selected, onSelect, isDark }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-6 pb-4 scrollbar-hide">
      {["All", ...categories].map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selected === cat
              ? isDark ? "bg-coral text-white" : "bg-[#1a1a1a] text-white"
              : isDark ? "bg-white/10 text-white/60" : "bg-white text-[#666] border border-[#e5e5e5]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create ProductCard and ProductGrid components**

Create `components/store/ProductCard.tsx` and `components/store/ProductGrid.tsx` as standalone components. ProductCard displays: 3:4 image, title (truncated), price with compare-at strikethrough. ProductGrid takes a title, product array, and renders a responsive grid (2 cols mobile, 3-4 desktop).

See spec for exact layout. Code provided in original plan is correct — copy from there.

- [ ] **Step 6: Create StorePageClient (interactive client component)**

Create `app/(public)/store/[slug]/StorePageClient.tsx` — handles category filtering, product modal state:

```typescript
"use client";

import { useState } from "react";
import { CategoryChips } from "@/components/store/CategoryChips";
import { ProductGrid } from "@/components/store/ProductGrid";
import { StoreProductModal } from "@/components/store/StoreProductModal";

interface StorePageClientProps {
  products: any[];
  categories: string[];
  isDark: boolean;
  merchantId: string;
}

export function StorePageClient({ products, categories, isDark, merchantId }: StorePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const filtered = selectedCategory === "All"
    ? products
    : products.filter((p) => p.productType === selectedCategory);

  // New products — latest 8 by createdAt
  const newProducts = [...filtered]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // Best Selling — for now, show all products. Once order data accumulates,
  // this should be sorted by OrderItem count. TODO: add sales count query.
  const bestSelling = filtered.slice(0, 8);

  return (
    <>
      <CategoryChips
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        isDark={isDark}
      />
      <ProductGrid title="New" products={newProducts} isDark={isDark} onProductClick={setSelectedProductId} />
      <ProductGrid title="Best Selling" products={bestSelling} isDark={isDark} onProductClick={setSelectedProductId} />
      <ProductGrid title="All Products" products={filtered} isDark={isDark} onProductClick={setSelectedProductId} />

      {selectedProductId && (
        <StoreProductModal
          productId={selectedProductId}
          merchantId={merchantId}
          isDark={isDark}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </>
  );
}
```

Note: "Best Selling" is a placeholder — sorted by recency for now. Once enough order data exists, sort by `OrderItem` count. This is acceptable for launch.

- [ ] **Step 7: Commit**

```bash
git add app/(public)/store/ components/store/StoreHeader.tsx components/store/CategoryChips.tsx components/store/ProductCard.tsx components/store/ProductGrid.tsx
git commit -m "feat: add merchant storefront pages — store header, categories, product grid, adaptive theme"
```

---

### Task 9: Store Product Detail Modal (Bottom Sheet)

**Files:**
- Create: `components/store/StoreProductModal.tsx`
- Create: `components/store/UGCRow.tsx`
- Create: `app/api/store/[merchantId]/products/[productId]/route.ts`

- [ ] **Step 1: Create store product API endpoint**

Create `app/api/store/[merchantId]/products/[productId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { merchantId: string; productId: string } }
) {
  const product = await prisma.merchantProduct.findUnique({
    where: { id: params.productId },
  });

  if (!product || product.merchantId !== params.merchantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get all variants of this product (each MerchantProduct row = one variant)
  const variants = await prisma.merchantProduct.findMany({
    where: {
      merchantId: params.merchantId,
      shopifyProductId: product.shopifyProductId,
      available: true,
    },
    orderBy: { price: "asc" },
  });

  // Get UGC videos that tag any variant of this product
  const variantIds = variants.map((v) => v.id);
  const ugcVideos = await prisma.video.findMany({
    where: {
      status: "READY",
      published: true,
      products: {
        some: {
          merchantProductId: { in: variantIds },
        },
      },
    },
    include: {
      user: { select: { username: true } },
      score: { select: { totalViews: true } },
    },
    orderBy: { score: { totalViews: "desc" } },
    take: 10,
  });

  return NextResponse.json({ product, variants, ugcVideos });
}
```

- [ ] **Step 2: Create UGCRow component**

Create `components/store/UGCRow.tsx` — horizontal scroll of video thumbnails with creator handle + view count. Code provided in original plan is correct — copy from there.

- [ ] **Step 3: Create StoreProductModal**

Create `components/store/StoreProductModal.tsx` — bottom sheet with: drag handle, image carousel, brand/title/price, variant chips, ATC button, collapsible sections (Description, Sizing & Fit, Shipping & Returns), UGC row.

**Key implementation notes:**
- Prisma `Json` fields are already parsed — do NOT call `JSON.parse()` on `product.images`. Use: `const images: string[] = (product.images as string[]) || (product.imageUrl ? [product.imageUrl] : []);`
- Each variant is a separate `MerchantProduct` row. The variant `title` field contains the size/option label.
- The `selectedSize` on CartItem is redundant since selecting a variant means selecting a specific `MerchantProduct.id`. When adding to cart, send `merchantProductId` of the selected variant.

See original plan for the full component code — it is correct except for the `JSON.parse` fix above.

- [ ] **Step 4: Commit**

```bash
git add components/store/StoreProductModal.tsx components/store/UGCRow.tsx app/api/store/
git commit -m "feat: add store product detail modal — variants, ATC, collapsible sections, UGC row"
```

---

## Chunk 4: Desktop Sidebar Navigation

### Task 10: Create Desktop Sidebar Component

**Files:**
- Create: `components/nav/Sidebar.tsx`
- Modify: `app/(app)/layout.tsx` (this is a `"use client"` component — keep it as client component)

**IMPORTANT context about existing layout:**
- `app/(app)/layout.tsx` is a `"use client"` component
- It uses `useAuth()` which returns `{ user, status, signOut }` (NOT `session`)
- It renders `<MessagePopup />` for flash messages
- It passes `user` and `pathname` props to `<BottomNav user={user} pathname={pathname} />`
- BottomNav is a named export: `import { BottomNav } from "@/components/nav/BottomNav"`
- BottomNav already has `md:hidden` on its outer container

- [ ] **Step 1: Create Sidebar component**

Create `components/nav/Sidebar.tsx`. Use SVG icons matching the existing BottomNav icon style (not emojis):

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Use SVGs matching existing BottomNav icons
const FeedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const DiscoverIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const OrdersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const VideosIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const consumerLinks: NavLink[] = [
  { href: "/feed", label: "Feed", icon: <FeedIcon /> },
  { href: "/discover", label: "Discover", icon: <DiscoverIcon /> },
  { href: "/orders", label: "Orders", icon: <OrdersIcon /> },
  { href: "/checkout", label: "Cart", icon: <CartIcon /> },
];

const creatorLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/dashboard/videos", label: "My Videos", icon: <VideosIcon /> },
  { href: "/dashboard/settings", label: "Settings", icon: <SettingsIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const isCreator = user?.role === "CREATOR" || user?.role === "ADMIN";

  const isActive = (href: string) =>
    pathname === href || (href !== "/feed" && pathname.startsWith(href));

  if (!user) return null;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[200px] bg-white border-r border-[#f0f0f0] flex-col z-40">
      <div className="px-5 pt-5 pb-6">
        <Link href="/feed" className="text-lg font-bold text-[#1a1a1a]">Scrollr</Link>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {consumerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
              isActive(link.href) ? "bg-[#f5f3f0] font-semibold text-[#1a1a1a]" : "text-[#888] hover:text-[#1a1a1a] hover:bg-[#faf9f7]"
            }`}
          >
            <span className="w-5 h-5 flex items-center justify-center">{link.icon}</span>
            {link.label}
          </Link>
        ))}

        {isCreator && (
          <>
            <div className="h-px bg-[#f0f0f0] my-2" />
            <p className="text-[10px] text-[#bbb] uppercase tracking-wider px-2 mb-1">Creator</p>
            {creatorLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(link.href) ? "bg-[#f5f3f0] font-semibold text-[#1a1a1a]" : "text-[#888] hover:text-[#1a1a1a] hover:bg-[#faf9f7]"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="px-3 pb-4 border-t border-[#f0f0f0] pt-3">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#faf9f7] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#e8e5e0] flex items-center justify-center text-xs font-bold text-[#1a1a1a]">
            {(user.name || user.username || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#1a1a1a] truncate">{user.name || user.username}</p>
            <p className="text-[10px] text-[#aaa] truncate">@{user.username}</p>
          </div>
        </Link>
        <button
          onClick={signOut}
          className="w-full text-left px-2 py-2 text-xs text-[#999] hover:text-red-500 transition-colors mt-1"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Update app layout to use Sidebar instead of top header**

In `app/(app)/layout.tsx`, this is a `"use client"` component. Keep it as client component. Changes:
1. Import `Sidebar` from `@/components/nav/Sidebar`
2. Remove the entire `<header>` block (lines 61-123)
3. Add `<Sidebar />` before `<main>`
4. Add `md:ml-[200px]` to `<main>` to offset for sidebar on desktop
5. Keep `<MessagePopup />`, `<BottomNav>`, loading state, and auth redirect as-is

The layout should become:

```typescript
return (
  <div className="min-h-screen bg-bg">
    <MessagePopup />
    <Sidebar />

    {/* Remove the entire <header> block that was here */}

    <main className="pb-[76px] md:pb-0 md:ml-[200px]">{children}</main>

    <BottomNav user={user} pathname={pathname} />
  </div>
);
```

**Keep everything else in the file unchanged** — the `"use client"` directive, imports, `useAuth()`, `useRouter()`, `useEffect` for auth redirect, loading spinner, `isCreator` check (even if unused now — the Sidebar handles it internally).

- [ ] **Step 3: Verify BottomNav already has md:hidden**

Check `components/nav/BottomNav.tsx` — the outer container div should already have `md:hidden`. If not, add it. Looking at existing code, line 148 has `md:hidden` — confirmed.

- [ ] **Step 4: Test on desktop and mobile**

```bash
npm run dev
```

- Desktop (>768px): sidebar visible on left, no top header, content offset 200px, bottom nav hidden
- Mobile (<768px): sidebar hidden, bottom nav visible, no offset

- [ ] **Step 5: Commit**

```bash
git add components/nav/Sidebar.tsx app/(app)/layout.tsx
git commit -m "feat: add desktop sidebar navigation — SVG icons, role-based sections, replace top header"
```

---

## Chunk 5: Merchant Dashboard + Emails

### Task 11: Merchant Dashboard Redesign

**Files:**
- Create: `components/merchant/StripeConnectBanner.tsx`
- Create: `components/merchant/DashboardStats.tsx`
- Create: `components/merchant/RecentOrders.tsx`
- Create: `components/merchant/TopProducts.tsx`
- Create: `components/merchant/TopUGC.tsx`
- Modify: `app/(merchant)/merchant/page.tsx` (existing merchant overview — the route is `/merchant` which maps to this file)
- Modify: `app/(merchant)/layout.tsx` (add Storefront nav item)

- [ ] **Step 1: Create StripeConnectBanner**

Create `components/merchant/StripeConnectBanner.tsx`:

```typescript
"use client";

import { useState } from "react";

export function StripeConnectBanner() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FFF0E0] border border-[#FDDCB5] rounded-xl p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl">💳</span>
        <div>
          <p className="text-sm font-semibold text-[#92400e]">Connect Stripe to receive payouts</p>
          <p className="text-xs text-[#b45309] mt-0.5">Your store is live but you can&apos;t receive payments yet</p>
        </div>
      </div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-xs font-semibold hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        {loading ? "Loading..." : "Connect Stripe"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create DashboardStats, RecentOrders, TopProducts, TopUGC**

Create each as a presentational component receiving data via props. Follow the design spec mockup for exact layout:

- `components/merchant/DashboardStats.tsx` — 4-column stat cards (Revenue, Orders, Conversion, Creators)
- `components/merchant/RecentOrders.tsx` — list of recent orders with status badges (Shipped/Pending/Delivered)
- `components/merchant/TopProducts.tsx` — list of top products with sales count + CVR
- `components/merchant/TopUGC.tsx` — horizontal scroll of creator video thumbnails with CVR overlay

Each component follows the warm light aesthetic: white cards, `#f0f0f0` borders, `#1a1a1a` headings, `#999` secondary text.

- [ ] **Step 3: Update merchant overview page**

Modify `app/(merchant)/merchant/page.tsx` (note: path is under `merchant/` subfolder, NOT directly in `(merchant)/`):

```typescript
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StripeConnectBanner } from "@/components/merchant/StripeConnectBanner";
import { DashboardStats } from "@/components/merchant/DashboardStats";
import { RecentOrders } from "@/components/merchant/RecentOrders";
import { TopProducts } from "@/components/merchant/TopProducts";
import { TopUGC } from "@/components/merchant/TopUGC";

export default async function MerchantOverview() {
  const user = await getUser();
  if (!user) redirect("/login");

  const merchant = await prisma.merchant.findUnique({
    where: { userId: user.id },
    include: {
      orders: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { orderItems: true },  // Note: relation is "orderItems" not "items"
      },
    },
  });

  if (!merchant) redirect("/");

  const totalRevenue = merchant.orders.reduce((sum, o) => sum + (o.subtotal * 0.85), 0);
  const orderCount = merchant.orders.length;

  const stats = [
    { label: "Revenue", value: `€${totalRevenue.toFixed(0)}` },
    { label: "Orders", value: String(orderCount) },
    { label: "Conversion", value: "—" },
    { label: "Creators", value: "—" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {!merchant.stripeConnectOnboarded && <StripeConnectBanner />}

      <h1 className="text-xl font-bold text-[#1a1a1a] mb-1">
        Good morning, {merchant.storeName}
      </h1>
      <p className="text-sm text-[#999] mb-6">Here&apos;s how your Scrollr storefront is performing</p>

      <DashboardStats stats={stats} />

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <RecentOrders orders={merchant.orders} />
        <TopProducts merchantId={merchant.id} />
      </div>

      <TopUGC merchantId={merchant.id} />
    </div>
  );
}
```

- [ ] **Step 4: Add Storefront nav item to merchant sidebar**

In `app/(merchant)/layout.tsx`, find the `merchantNavItems` array (~line 10) and add a Storefront entry:

```typescript
{ label: "Storefront", href: "/merchant/storefront", icon: /* palette/paint SVG icon */ },
```

Add it between Analytics and Settings.

- [ ] **Step 5: Commit**

```bash
git add components/merchant/ app/(merchant)/
git commit -m "feat: redesign merchant dashboard — stats, Stripe banner, recent orders, top products, top UGC"
```

---

### Task 12: Resend Email Templates

**Files:**
- Modify: `lib/email.ts` (rewrite wrapper + all templates)

- [ ] **Step 1: Update FROM_ADDRESS**

In `lib/email.ts` line 3, change:

```typescript
const FROM_ADDRESS = "Scrollr <hello@scrollr.co>";
```

- [ ] **Step 2: Replace wrapHtml with warm light design**

Replace the existing `wrapHtml` function (~lines 7-41) with:

```typescript
function wrapHtml(content: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:22px;font-weight:800;color:#1a1a1a;letter-spacing:-0.5px;">Scrollr</span>
    </div>
    <div style="background:white;border:1px solid #f0f0f0;border-radius:16px;padding:32px;margin-bottom:24px;">
      ${content}
    </div>
    <div style="text-align:center;padding:16px 0;">
      <p style="font-size:11px;color:#bbb;margin:0;">&copy; ${year} Scrollr &middot; scrollr.co</p>
    </div>
  </div>
</body>
</html>`;
}
```

- [ ] **Step 3: Write all 9 email template functions**

Add/update these functions in `lib/email.ts`. Each builds HTML content, wraps it, sends via Resend. Use this button style throughout:

```html
<a href="{url}" style="display:inline-block;padding:12px 24px;background:#FF6B4A;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Button Text</a>
```

**1. sendMerchantWelcome** (NEW):
```typescript
export async function sendMerchantWelcome(
  email: string,
  storeName: string,
  slug: string,
  productCount: number
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scrollr.co";
  const resend = getResend();
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Your store is live on Scrollr! 🎉</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 20px;">
      Welcome, <strong>${storeName}</strong>. We've synced <strong>${productCount} products</strong> from your Shopify store.
      Your storefront is already live and ready for customers.
    </p>
    <p style="font-size:13px;color:#888;margin:0 0 4px;">Your storefront URL:</p>
    <p style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 24px;">${appUrl}/store/${slug}</p>
    <h2 style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 12px;">Next steps</h2>
    <ol style="font-size:14px;color:#666;line-height:1.8;margin:0 0 24px;padding-left:20px;">
      <li><strong>Connect Stripe</strong> to start receiving payouts</li>
      <li><strong>Customize your storefront</strong> — choose light or dark theme, add a description</li>
      <li><strong>Invite creators</strong> to make content featuring your products</li>
    </ol>
    <div style="text-align:center;">
      <a href="${appUrl}/merchant" style="display:inline-block;padding:12px 24px;background:#FF6B4A;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Go to Dashboard</a>
    </div>
  `;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Your store is live on Scrollr",
    html: wrapHtml(content),
  });
}
```

**2. sendStripeConnectReminder** (NEW):
```typescript
export async function sendStripeConnectReminder(email: string, storeName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scrollr.co";
  const resend = getResend();
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Start receiving payouts</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 20px;">
      Hey ${storeName}, your Scrollr storefront is live and customers can browse your products.
      Connect your Stripe account so you can start receiving payouts when sales come in.
    </p>
    <div style="text-align:center;">
      <a href="${appUrl}/merchant" style="display:inline-block;padding:12px 24px;background:#FF6B4A;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Connect Stripe</a>
    </div>
  `;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Start receiving payouts on Scrollr",
    html: wrapHtml(content),
  });
}
```

**3. sendMerchantNewOrder** (NEW):
```typescript
export async function sendMerchantNewOrder(
  email: string,
  storeName: string,
  orderNumber: string,
  items: { title: string; quantity: number; price: number }[],
  revenue: number
) {
  const resend = getResend();
  const itemRows = items.map(i =>
    `<tr><td style="padding:8px 0;font-size:13px;color:#1a1a1a;border-bottom:1px solid #f5f5f5;">${i.title} × ${i.quantity}</td><td style="padding:8px 0;font-size:13px;color:#1a1a1a;text-align:right;border-bottom:1px solid #f5f5f5;">€${(i.price * i.quantity).toFixed(2)}</td></tr>`
  ).join("");
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">New sale! 🎉</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 20px;">
      ${storeName}, you have a new order on Scrollr.
    </p>
    <div style="background:#FAFAF8;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="font-size:12px;color:#999;margin:0 0 4px;">Order</p>
      <p style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0;">#${orderNumber}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
      ${itemRows}
      <tr><td style="padding:12px 0;font-size:14px;font-weight:600;color:#1a1a1a;">Your revenue</td><td style="padding:12px 0;font-size:14px;font-weight:600;color:#22c55e;text-align:right;">€${revenue.toFixed(2)}</td></tr>
    </table>
    <p style="font-size:13px;color:#888;margin:0 0 4px;">Please fulfill this order from your Shopify admin.</p>
  `;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `New sale on Scrollr — Order #${orderNumber}`,
    html: wrapHtml(content),
  });
}
```

**4. sendEmailConfirmation** (NEW):
```typescript
export async function sendEmailConfirmation(email: string, confirmUrl: string) {
  const resend = getResend();
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Confirm your email</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">
      Click the button below to verify your email address and get started on Scrollr.
    </p>
    <div style="text-align:center;">
      <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#FF6B4A;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Confirm Email</a>
    </div>
    <p style="font-size:12px;color:#bbb;margin:16px 0 0;text-align:center;">If you didn't create an account, you can ignore this email.</p>
  `;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Confirm your email — Scrollr",
    html: wrapHtml(content),
  });
}
```

**5-9: Update existing templates** — `sendWelcomeEmail`, `sendOrderConfirmation`, `sendCreatorApplicationResult`, `sendModerationNotice`, `sendStrikeNotice` — keep their logic but replace the dark `wrapHtml` content with the new warm light wrapper (already done by replacing `wrapHtml`). No code changes needed in those functions since they call `wrapHtml` which is now updated.

**Add sendOrderShipped** (NEW):
```typescript
export async function sendOrderShipped(
  email: string,
  orderNumber: string,
  trackingNumber: string | null,
  trackingUrl: string | null,
  items: { title: string; quantity: number }[]
) {
  const resend = getResend();
  const itemList = items.map(i => `<li style="font-size:13px;color:#666;padding:4px 0;">${i.title} × ${i.quantity}</li>`).join("");
  const trackingBlock = trackingNumber
    ? `<div style="background:#FAFAF8;border-radius:8px;padding:16px;margin:0 0 16px;">
        <p style="font-size:12px;color:#999;margin:0 0 4px;">Tracking number</p>
        <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0;">${trackingNumber}</p>
        ${trackingUrl ? `<a href="${trackingUrl}" style="font-size:13px;color:#FF6B4A;text-decoration:none;margin-top:8px;display:inline-block;">Track your package →</a>` : ""}
       </div>`
    : "";
  const content = `
    <h1 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Your order has shipped! 📦</h1>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 20px;">
      Great news — order <strong>#${orderNumber}</strong> is on its way.
    </p>
    ${trackingBlock}
    <p style="font-size:13px;color:#888;margin:0 0 8px;">Items in this shipment:</p>
    <ul style="margin:0 0 16px;padding-left:20px;">${itemList}</ul>
  `;
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: `Your order has shipped — #${orderNumber}`,
    html: wrapHtml(content),
  });
}
```

- [ ] **Step 4: Wire up emails in checkout and webhook handlers**

In `app/api/checkout/route.ts`, after creating each merchant's order, call `sendMerchantNewOrder`:

```typescript
import { sendMerchantNewOrder } from "@/lib/email";

// After order creation for each merchant:
if (merchant?.user?.email) {
  const orderItems = items.map((i: any) => ({
    title: i.title || "Product",
    quantity: i.quantity,
    price: i.unitPrice,
  }));
  await sendMerchantNewOrder(
    merchant.user.email,
    merchant.storeName || "",
    order.orderNumber,
    orderItems,
    fees.merchantPayout
  );
}
```

In `app/api/webhooks/shopify/route.ts`, in the `orders/fulfilled` handler, call `sendOrderShipped` to the consumer.

- [ ] **Step 5: Commit**

```bash
git add lib/email.ts app/api/checkout/route.ts app/api/webhooks/shopify/route.ts
git commit -m "feat: rewrite all email templates — warm light design, 9 templates, scrollr.co domain"
```

---

### Task 13: Merchant Storefront Settings Page

**Files:**
- Create: `app/(merchant)/merchant/storefront/page.tsx` (note: under `merchant/` subfolder to match route `/merchant/storefront`)
- Create: `app/api/merchant/storefront/route.ts`

- [ ] **Step 1: Create storefront settings API**

Create `app/api/merchant/storefront/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "MERCHANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ merchant });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "MERCHANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { storeTheme, storeDescription } = body;

  // Note: storeLogoUrl already exists on the Merchant model — include it if you add logo upload later
  const merchant = await prisma.merchant.update({
    where: { userId: user.id },
    data: {
      ...(storeTheme !== undefined && { storeTheme }),
      ...(storeDescription !== undefined && { storeDescription }),
    },
  });

  return NextResponse.json({ merchant });
}
```

- [ ] **Step 2: Create storefront settings page**

Create `app/(merchant)/merchant/storefront/page.tsx` — form with theme toggle (light/dark), description textarea, storefront URL display. See original plan for complete component code.

- [ ] **Step 3: Add .superpowers to .gitignore**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 4: Commit**

```bash
git add "app/(merchant)/merchant/storefront/" app/api/merchant/storefront/ .gitignore
git commit -m "feat: add merchant storefront settings — theme toggle, description, URL display"
```

---

### Task 14: Final Verification

- [ ] **Step 1: Run Prisma generate and verify no errors**

```bash
npx prisma generate
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 3: Run the dev server and smoke test all flows**

```bash
npm run dev
```

Test checklist:
1. Landing page — header shows Sign in + Get Started (no Merchant Login) ✓
2. Desktop sidebar nav — visible on wide screens with SVG icons, role-based sections, Cart link ✓
3. Mobile bottom nav — visible on small screens, hidden on desktop ✓
4. `/store/{slug}` — storefront loads with products, category chips, New/Best Selling/All sections ✓
5. Store product modal — slides up, shows variants, ATC works, collapsible sections, UGC row ✓
6. Merchant dashboard — stats, Stripe Connect banner, recent orders, top products, top UGC ✓
7. Merchant storefront settings — theme toggle, description save, URL display ✓
8. Checkout — PaymentIntent with transfer_group, Checkout record, transfers to merchants ✓

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve type errors and integration issues from marketplace redesign"
```
