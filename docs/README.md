# Scrollr Documentation

Scrollr is a social video commerce platform that combines short-form shoppable video content with a multi-merchant marketplace. Think TikTok meets Shopify — creators upload videos, tag products from merchant stores, and earn commissions on every sale.

## Documentation Structure

### Architecture
- [System Overview](./architecture/system-overview.md) — Tech stack, infrastructure, and how everything connects
- [Database Schema](./architecture/database-schema.md) — All Prisma models, enums, and relationships
- [Authentication](./architecture/authentication.md) — Supabase Auth + Prisma user sync

### Guides
- [Music & Copyright](./guides/music-licensing.md) — Music usage policy, licensing options, and copyright compliance
- [Content Moderation](./guides/content-moderation.md) — 5-layer content safety system
- [Shopify Integration](./guides/shopify-integration.md) — Merchant onboarding, product sync, and order flow
- [Payment System](./guides/payment-system.md) — Stripe Connect, commissions, and payout flow

### Admin
- [Admin Panel](./admin/admin-panel.md) — Complete admin panel feature reference
- [User Management](./admin/user-management.md) — Delete, ban, strike, and role management
- [Content Management](./admin/content-management.md) — Video moderation, deletion, and reporting

### API Reference
- [Admin API](./api-reference/admin-api.md) — All admin endpoints with request/response formats
- [Public API](./api-reference/public-api.md) — Feed, products, store, and user-facing endpoints

### Deployment
- [Environment Variables](./deployment/environment-variables.md) — All required env vars and their purpose
- [Production Checklist](./deployment/production-checklist.md) — Pre-launch verification steps

---

## Quick Links

| Area | URL | Description |
|------|-----|-------------|
| Feed | `/feed` | Main video feed (TikTok-style) |
| Dashboard | `/dashboard` | Creator dashboard |
| Admin | `/admin` | Admin panel (requires ADMIN role) |
| Merchant | `/merchant` | Merchant dashboard |
| Storefront | `/store/{slug}` | Public merchant storefront |
| API Health | `/api/health` | API health check |

## Revenue Model

| Party | Share | Description |
|-------|-------|-------------|
| Merchant | 85% | Product seller revenue |
| Scrollr | 10% | Platform fee |
| Creator | 3% | Commission on attributed sales |
| Stripe | ~2% | Payment processing |
