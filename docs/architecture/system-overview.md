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
| CREATOR | Upload videos, tag products, earn 3% commission, analytics |
| MERCHANT | Manage Shopify store, product sync, order fulfillment, storefront |
| ADMIN | Full platform management, moderation, user/content/merchant CRUD |

## Trust Levels (Progressive)

| Level | Age | Upload Limit | Moderation |
|-------|-----|-------------|------------|
| NEW | 0-24h | 1 video/day | All held for review |
| BASIC | 1-7d | Per plan limits | Standard |
| ESTABLISHED | 7-30d | Full plan limits | Relaxed |
| TRUSTED | 30+ days, 0 strikes | Full limits | Auto-approve |

## Request Flow

1. User request hits Next.js middleware
2. Supabase session verified
3. API route handler authenticates via `getUser()`
4. Business logic with Prisma queries
5. External service calls (Stripe, Shopify, etc.) as needed
6. JSON response returned
