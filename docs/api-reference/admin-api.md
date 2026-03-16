# Admin API Reference

All admin endpoints require authentication and `ADMIN` role. Returns `403 Forbidden` if not admin.

## Stats

### GET /api/admin/stats
Returns platform-wide KPIs.

Response:
```json
{
  "totalUsers": 150,
  "totalCreators": 25,
  "totalMerchants": 10,
  "totalOrders": 500,
  "totalVideos": 300,
  "totalProducts": 200,
  "pendingApplications": 5,
  "totalRevenue": 15000.00,
  "scrollrEarnings": 1500.00,
  "creatorPayouts": 450.00,
  "recentOrders": [...],
  "recentUsers": [...]
}
```

## Users

### GET /api/admin/users
List users with search and pagination.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page (max 100) |
| search | string | - | Search email, username, name |

### PATCH /api/admin/users
Perform action on a user.

Body:
```json
{
  "userId": "clu...",
  "action": "change_role | apply_strike | reset_strikes | ban | unban",
  "role": "ADMIN | USER | CREATOR"  // only for change_role
}
```

### DELETE /api/admin/users?userId={id}
Permanently delete a user and all cascaded data.

## Content

### GET /api/admin/content
List all videos with search and status filtering.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Results per page |
| search | string | - | Search title, description, creator |
| status | string | all | Filter by VideoStatus |

### GET /api/admin/videos
List published READY videos (limited).

### GET /api/admin/videos/{id}
Get single video details.

### DELETE /api/admin/videos/{id}
Delete a video permanently. Creates moderation log.

## Moderation

### GET /api/admin/moderation
List PENDING_REVIEW videos.

### PATCH /api/admin/moderation/{id}
Body: `{ "action": "approve | reject | ban_user", "reason?": "..." }`

## Reports

### GET /api/admin/reports
List user-submitted reports.

### PATCH /api/admin/reports/{id}
Dismiss, remove video, or ban user.

## Merchants

### GET /api/admin/merchants
List all merchants with revenue stats.

### POST /api/admin/merchants
Create a new merchant. Auto-creates user if no `userId` provided.

Body:
```json
{
  "userId": "optional",
  "shopifyDomain": "store.myshopify.com",
  "shopifyAccessToken": "optional",
  "storeName": "My Store",
  "storeLogoUrl": "optional",
  "shippingPolicy": "optional",
  "returnPolicy": "optional"
}
```

### PATCH /api/admin/merchants
Update merchant details.

Body: `{ "merchantId": "...", "storeName?", "storeLogoUrl?", "shippingPolicy?", "returnPolicy?", "active?" }`

### DELETE /api/admin/merchants?merchantId={id}
Permanently delete a merchant and their products.

## Merchant Products

### GET /api/admin/merchants/{id}/products
List products for a merchant.

### POST /api/admin/merchants/{id}/products
Add a product to a merchant.

### PATCH /api/admin/merchants/{id}/products
Update a product. Body includes `productId`.

### DELETE /api/admin/merchants/{id}/products?productId={id}
Delete a specific product.

## Demo Store

### POST /api/admin/demo-store
Create a demo store with 20 sample products.

Body: `{ "storeName?": "Demo Brand Store", "slug?": "demo-brand-store" }`

### DELETE /api/admin/demo-store?slug={slug}
Delete a demo store and its data.

## Creator Applications

### GET /api/admin/creator-applications
List pending applications.

### PATCH /api/admin/creator-applications/{id}
Approve or reject.

## Messages

### POST /api/admin/messages
Send admin message to a user.

## Creators

### GET /api/admin/creators
List creators with stats.
