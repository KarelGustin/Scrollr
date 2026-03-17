# Public & User API Reference

## Authentication

### POST /api/auth/register
Register a new user account.

### POST /api/auth/login
Sign in with email/password.

### GET /api/user/role
Returns the current user's role.

### GET /api/user/profile
Returns the current user's profile.

### PATCH /api/user/profile
Update profile (username, name, bio, avatar).

## Feed

### GET /api/feed
Returns personalized video feed. Accessible to anonymous users (no auth required).

| Param | Type | Description |
|-------|------|-------------|
| cursor | string | Pagination cursor |
| limit | number | Videos per page (default 10) |

Response includes video data, creator info, tagged products (with EUR-formatted prices), and engagement scores. Supports infinite scroll via cursor-based pagination.

The `FeedVideoProduct` type includes an `images: string[] | null` field for product image galleries.

## Videos

### POST /api/upload/presign
Get presigned URL for video upload to Cloudflare Stream.

### POST /api/videos
Create video record after upload.

### PATCH /api/videos/{id}
Update video metadata (title, description, category).

### POST /api/videos/{id}/report
Report a video for policy violation.

Body: `{ "reason": "SEXUAL_CONTENT | VIOLENCE | ...", "details?": "..." }`

## Products

### GET /api/products
List products. Prices are returned in EUR.

### POST /api/products
Create a product (creator).

### GET /api/products/{id}
Get product details.

### GET /api/products/related
Get related products from the same merchant or category.

| Param | Type | Description |
|-------|------|-------------|
| merchantProductId | string | The product to find related items for |

Returns a list of related products for the context panel.

## Recommendations

### GET /api/recommendations
Algorithmic product recommendations based on video context.

| Param | Type | Description |
|-------|------|-------------|
| videoId | string | The video to get recommendations for |

Returns recommended products relevant to the video content.

## Cart

### GET /api/cart
Get current cart contents.

### POST /api/cart/items
Add item to cart.

### PATCH /api/cart/items/{id}
Update cart item quantity.

### DELETE /api/cart/items/{id}
Remove item from cart.

## Merchant Products

### GET /api/merchant-products
List merchant products with search, pagination, and filtering.

| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by title, vendor, type, or tags |
| merchantId | string | Filter by merchant ID |
| page | number | Page number (default 1) |
| limit | number | Items per page (default 20, max 100) |

### GET /api/create/merchants
List active merchants for product tagging in the creator posting flow.

## Creator Application

### GET /api/creator-application
Get current user's creator application status.

### POST /api/creator-application
Submit creator application with category, social links, primary platform, follower count, and pitch.

## Checkout

### POST /api/checkout
Standard cart checkout. Supports both authenticated and **guest checkout** (email-only).

Actions:
- `create-intent` — Creates Stripe PaymentIntent for cart total
- `confirm` — After payment, creates orders per merchant

For guest checkout, include `email` field in the request body.

### POST /api/checkout/quick
Quick checkout (Buy Now) for a single product. Creates a Stripe PaymentIntent for immediate purchase.

| Field | Type | Description |
|-------|------|-------------|
| merchantProductId | string | Product to purchase |
| videoId | string? | Source video (for attribution) |
| creatorId | string? | Creator to attribute commission to |

Supports Stripe Link for returning customers (uses stored `stripeCustomerId`).

### GET /api/shipping/rates
Fetch shipping rates for cart items.

## Store

### GET /api/store/{slug}
Get merchant storefront data.

### GET /api/store/{slug}/products
List merchant's products.

## Merchant

### GET /api/merchant/sync-status
Returns the current product sync status and product count for the authenticated merchant.

Response:
```json
{
  "syncStatus": "COMPLETE",
  "productCount": 42
}
```

## Events / Analytics

### POST /api/events
Track user interaction events.

Event types: PAGE_VIEW, VIDEO_START, VIDEO_COMPLETE, SWIPE_NEXT, SWIPE_PREV, SHOP_CLICK, ADD_TO_CART, SHARE

### GET /api/analytics
Get analytics for the current user (creator/merchant).

## Social

### POST /api/follow
Follow/unfollow a user.

### GET /api/followers
Get followers/following lists.

## Webhooks

### POST /api/webhooks/stripe
Stripe payment webhook handler.

### POST /api/webhooks/shopify
Shopify event webhook handler.

### POST /api/webhooks/cloudflare
Cloudflare Stream processing webhook handler.
