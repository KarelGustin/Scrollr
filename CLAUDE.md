# Scrollr — Development Guidelines

## Project Overview

Scrollr is a social video commerce platform (TikTok + Shopify marketplace). Creators upload short-form videos, tag merchant products, and earn commissions on sales.

**Tech Stack**: Next.js 14 (App Router), TypeScript, Prisma (PostgreSQL), Supabase Auth, Stripe Connect, Cloudflare Stream, Tailwind CSS, Zustand, React Query

## Documentation Rules

**IMPORTANT**: Always update documentation when making changes to the project.

When you modify any of the following, update the corresponding documentation:

| Change Area | Documentation File |
|-------------|-------------------|
| Database schema | `docs/architecture/database-schema.md` |
| API endpoints | `docs/api-reference/admin-api.md` or `docs/api-reference/public-api.md` |
| Admin panel features | `docs/admin/admin-panel.md` |
| User management | `docs/admin/user-management.md` |
| Content management | `docs/admin/content-management.md` |
| Auth changes | `docs/architecture/authentication.md` |
| Shopify integration | `docs/guides/shopify-integration.md` |
| Payment/Stripe changes | `docs/guides/payment-system.md` |
| Content moderation | `docs/guides/content-moderation.md` |
| Music/copyright policy | `docs/guides/music-licensing.md` |
| Environment variables | `docs/deployment/environment-variables.md` |
| New features or architecture | `docs/architecture/system-overview.md` |

**Documentation index**: `docs/README.md` — Update when adding new documentation files.

## Project Structure

```
app/
  (app)/          → Consumer routes (feed, dashboard, cart, checkout, profile, analytics, orders)
  (merchant)/     → Merchant dashboard (products, orders, analytics, storefront, settings)
  (admin)/        → Admin panel (overview, moderation, reports, users, merchants, content, creators, applications)
  (public)/       → Public routes (auth, landing, discover, search, store, apply, onboarding)
  api/            → API route handlers
components/       → React components organized by feature
lib/              → Business logic and utilities
stores/           → Zustand state stores
hooks/            → Custom React hooks
types/            → TypeScript type definitions
prisma/           → Database schema and migrations
docs/             → Project documentation
```

## Key Conventions

### API Routes
- All admin routes check for ADMIN role via `requireAdmin()` helper
- Use `getUser()` from `lib/auth.ts` for authentication
- Return appropriate HTTP status codes (401, 403, 404, 400)
- Use Prisma for all database operations

### Components
- Use Tailwind CSS classes (no CSS modules)
- Follow existing color token conventions: `text-text`, `text-muted`, `bg-surface`, `bg-card`, `text-accent`, `text-destructive`
- Use `@tanstack/react-query` for server state management
- Use Zustand for client state (cart, feed)

### Admin Panel
- All admin pages are under `app/(admin)/admin/`
- Navigation is defined in `app/(admin)/layout.tsx` using `NAV_SECTIONS`
- When adding new admin pages, add a nav entry in the appropriate section
- Always add confirmation dialogs for destructive actions (delete, ban)
- Admin API routes live under `app/api/admin/`

### Database
- Schema is in `prisma/schema.prisma`
- Use cascade deletes where appropriate
- Add indexes for frequently queried fields
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev --name description` for new migrations

### Styling
- Dark theme by default using CSS custom properties
- Color tokens: `--bg`, `--surface`, `--card`, `--border`, `--text`, `--muted`, `--accent`, `--destructive`, `--success`, `--warning`, `--social`
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints

## User Roles

| Role | Description |
|------|-------------|
| USER | Regular consumer — browse, follow, shop |
| CREATOR | Video creator — upload, tag products, earn commissions |
| MERCHANT | Store owner — products via Shopify, fulfillment, analytics |
| ADMIN | Platform admin — full management, moderation, user CRUD |

## Revenue Model

- Merchant: ~85% (after Stripe fees)
- Scrollr: 10% platform fee
- Creator: 3% commission on attributed sales
- Stripe: ~2% processing

## Content Safety

5-layer defense: Trust limits → AI moderation → User reporting → Admin review → Strike system

See `docs/guides/content-moderation.md` for details.

## Running the Project

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Testing

- Ensure admin features work by creating an ADMIN user in the database
- Use the Demo Store feature (`/admin/demo-store`) to create test products
- Use the Dummy Data page (`/admin/dummy`) to generate test data
