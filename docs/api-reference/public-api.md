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
Returns personalized video feed.

| Param | Type | Description |
|-------|------|-------------|
| cursor | string | Pagination cursor |
| limit | number | Videos per page (default 10) |

Response includes video data, creator info, tagged products, and engagement scores.

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
List products.

### POST /api/products
Create a product (creator).

### GET /api/products/{id}
Get product details.

## Cart

### GET /api/cart
Get current cart contents.

### POST /api/cart/items
Add item to cart.

### PATCH /api/cart/items/{id}
Update cart item quantity.

### DELETE /api/cart/items/{id}
Remove item from cart.

## Checkout

### POST /api/stripe/checkout
Create Stripe checkout session.

### GET /api/shipping/rates
Fetch shipping rates for cart items.

## Store

### GET /api/store/{slug}
Get merchant storefront data.

### GET /api/store/{slug}/products
List merchant's products.

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
