# Shopify Integration

Scrollr integrates with Shopify stores to sync products, create orders, and track fulfillment.

## Merchant Onboarding Flow

1. Merchant visits `/apply` and fills out the merchant application
2. Admin approves the application at `/admin/applications`
3. Merchant is redirected to Shopify OAuth to install the Scrollr app
4. OAuth callback stores the access token and creates the `Merchant` record
5. Initial product sync pulls all products from the Shopify store
6. Merchant sets up their storefront at `/merchant/storefront`
7. Merchant connects Stripe Connect for payouts

## OAuth Flow

```
User → /api/merchant/register → Shopify OAuth → Callback → Store Token → Sync Products
```

Implementation: `lib/shopify.ts`

## Product Sync

Products are synced from the merchant's Shopify Admin API:

```typescript
// lib/shopify-sync.ts
syncMerchantProducts(merchantId: string)
```

Synced fields:
- Product ID, variant ID, title, description
- Images (primary + gallery)
- Price, compare-at price, currency
- SKU, inventory quantity, availability
- Tags, product type, vendor

### Sync Triggers
- **Initial**: Full sync on first connection
- **Manual**: Merchant can trigger sync from dashboard
- **Webhooks**: Real-time updates via Shopify webhooks:
  - `products/create` — New product added
  - `products/update` — Product modified
  - `products/delete` — Product removed
  - `inventory_levels/update` — Stock changes

## Order Creation

When a customer checks out on Scrollr:

1. Stripe payment is processed
2. For each merchant in the cart, an `Order` is created in the Scrollr database
3. A corresponding order is created on the merchant's Shopify store via Admin API
4. The Shopify order is marked as "paid"
5. Merchant fulfills the order through Shopify

Implementation: `app/api/stripe/checkout/route.ts`

## Webhooks

Scrollr registers the following Shopify webhooks:

| Topic | Handler | Purpose |
|-------|---------|---------|
| `products/create` | Sync new product | Keep catalog current |
| `products/update` | Update product data | Price/availability changes |
| `products/delete` | Remove product | Catalog cleanup |
| `inventory_levels/update` | Update stock | Prevent overselling |
| `orders/fulfilled` | Update order status | Track fulfillment |
| `app/uninstalled` | Deactivate merchant | Handle app removal |

Webhook endpoint: `POST /api/webhooks/shopify`

Webhook verification uses HMAC-SHA256 with the Shopify API secret.

## Shopify API Version

Current: `2024-10`

Defined in `lib/shopify.ts` as `SHOPIFY_API_VERSION`.

## Storefront

Each merchant gets a public storefront at `/store/{slug}` showing:
- Store name, logo, and description
- Product grid with filtering
- Individual product pages
- Store policies (shipping, returns)

## Admin Management

Admins can manage merchants at `/admin/merchants`:
- View all merchants with revenue and order counts
- Edit store details (name, logo, policies)
- Activate/deactivate merchants
- Manage products (add, edit, delete)
- Generate dummy products for testing
- Delete merchants entirely
- Create demo stores with sample products
