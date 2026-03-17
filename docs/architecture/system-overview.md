# System Overview

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Language | TypeScript 5.7 | Type safety throughout |
| Database | PostgreSQL (via Prisma 6.4) | Primary data store |
| Auth | Supabase Auth | OAuth (Google) + email/password |
| Payments | Stripe Connect | Marketplace payments, payouts |
| Video | Cloudflare Stream | Video hosting, HLS/DASH delivery |
| AI/Safety | OpenAI (Vision + Moderation) | Pre-publish content moderation |
| Email | Resend | Transactional emails |
| State | Zustand + React Query | Client state + server cache |
| Styling | Tailwind CSS 3.4 | Utility-first styling |
| UI | Radix UI primitives | Accessible components |

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  (app) Routes │  │ (merchant)   │  │  (admin) Routes  │   │
│  │  Feed, Cart,  │  │  Dashboard,  │  │  Moderation,     │   │
│  │  Checkout,    │  │  Products,   │  │  Users, Content, │   │
│  │  Profile      │  │  Orders      │  │  Merchants       │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                  │                    │             │
│  ┌──────┴──────────────────┴────────────────────┴─────────┐  │
│  │                    API Routes (/api)                     │  │
│  └──────┬──────────────────┬────────────────────┬─────────┘  │
└─────────┼──────────────────┼────────────────────┼────────────┘
          │                  │                    │
    ┌─────┴─────┐    ┌──────┴──────┐    ┌────────┴────────┐
    │ Supabase  │    │   Prisma    │    │  External APIs  │
    │ Auth      │    │ PostgreSQL  │    │                 │
    └───────────┘    └─────────────┘    │ - Stripe        │
                                        │ - Shopify       │
                                        │ - Cloudflare    │
                                        │ - OpenAI        │
                                        │ - Resend        │
                                        └─────────────────┘
```

## Directory Structure

```
scrollr/
├── app/
│   ├── (app)/          # Consumer routes (feed, dashboard, cart, checkout)
│   ├── (merchant)/     # Merchant dashboard routes
│   ├── (admin)/        # Admin panel routes
│   ├── (public)/       # Public routes (auth, landing, discover, store)
│   └── api/            # API route handlers
├── components/
│   ├── feed/           # Video feed components
│   ├── dashboard/      # Creator dashboard components
│   ├── merchant/       # Merchant components
│   ├── profile/        # Profile components
│   └── ui/             # Shared UI primitives
├── lib/
│   ├── auth.ts         # Supabase + Prisma auth
│   ├── prisma.ts       # Prisma client singleton
│   ├── shopify.ts      # Shopify API wrapper
│   ├── shopify-sync.ts # Product sync logic
│   ├── stripe-connect.ts # Stripe Connect helpers
│   ├── stripe-customer.ts # Stripe Customer ID helpers (getOrCreateStripeCustomer)
│   ├── cloudflare.ts   # Cloudflare Stream API
│   ├── moderation.ts   # AI content moderation
│   ├── analytics.ts    # Event aggregation
│   └── recommendation.ts # Video scoring algorithm
├── stores/
│   ├── cartStore.ts    # Cart state (Zustand)
│   └── feedStore.ts    # Feed state (Zustand)
├── hooks/              # Custom React hooks
├── types/              # TypeScript types
├── prisma/
│   └── schema.prisma   # Database schema
├── docs/               # Project documentation
└── public/             # Static assets
```

## User Roles

| Role | Capabilities |
|------|-------------|
| USER | Browse feed, follow creators, add to cart, checkout |
| CREATOR | Upload videos, tag products, earn 5% commission, cross-post to IG/TikTok, analytics |
| MERCHANT | Manage store (Shopify/CSV/WooCommerce), product sync, order fulfillment, storefront |
| ADMIN | Full platform management, moderation, user/content/merchant CRUD |

## Trust Levels (Progressive)

| Level | Age | Upload Limit | Moderation |
|-------|-----|-------------|------------|
| NEW | 0-24h | 1 video/day | All held for review |
| BASIC | 1-7d | Per plan limits | Standard |
| ESTABLISHED | 7-30d | Full plan limits | Relaxed |
| TRUSTED | 30+ days, 0 strikes | Full limits | Auto-approve |

## Layout & UI

### Desktop Split-Panel Layout
At `lg+` breakpoints, Scrollr uses a split-panel layout:
- **Left panel**: Phone-sized vertical video feed
- **Right panel**: Context panel showing creator info, product details, and related products
- The `FeedLayout` wrapper component manages the split-panel arrangement

### Sidebar
- At `lg+` the sidebar collapses to a 72px icon-only rail to maximize content space

### Context Panel
The right-side context panel displays:
- Creator profile info (avatar, bio, follow button)
- Product details for tagged products
- Related products from the same merchant/category

### Mobile
- Full-screen vertical feed (mobile-first)
- Bottom sheets for product details and checkout

## PWA Support

Scrollr is installable as a Progressive Web App:
- `manifest.json` defines app name, icons, theme color, and display mode
- Install banner prompts users to add Scrollr to their home screen

## Currency

All prices and transactions use **EUR** (Euro) globally.

## Feed & Authentication

- The video feed is accessible to **anonymous users** without authentication
- Users can scroll and browse freely without signing in
- **Guest checkout** is supported — no account required to purchase (email only)
- Cart is session-based and works for both authenticated and anonymous users
- Infinite scroll with cursor-based pagination for seamless browsing

## Buy Now Flow

A single-product quick checkout flow enables in-feed purchases:
- "Buy Now" button on product cards opens an in-feed checkout sheet
- Uses `POST /api/checkout/quick` for streamlined single-product checkout
- Supports Stripe Link for returning customers via stored `stripeCustomerId`

## Creator Posting Flow

Creators upload content via the `/create` page with a 4-step flow:

1. **Select**: Choose video from device gallery (no in-browser recording)
2. **Preview**: Full-screen video preview with trim info
3. **Details**: Add caption (300 chars) + tag up to 5 products from merchant stores
   - Filter by merchant, search by product name
   - Products shown with image, price, and merchant name
4. **Post**: Upload to Cloudflare Stream + cross-post options

### Cross-Posting
After posting, creators can share to Instagram and TikTok via:
- **Web Share API** (native share sheet on iOS/Android)
- **File download fallback** for desktop browsers

### Creator Targets
- Minimum: 10 posts/month (soft target)
- Tracked via `CreatorTarget` model (monthly)
- Warning issued if target not met

## Request Flow

1. User request hits Next.js middleware
2. Supabase session verified (if authenticated)
3. API route handler authenticates via `getUser()` (or allows anonymous for feed endpoints)
4. Business logic with Prisma queries
5. External service calls (Stripe, Shopify, etc.) as needed
6. JSON response returned
