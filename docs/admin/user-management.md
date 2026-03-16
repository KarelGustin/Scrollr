# User Management

## Overview

User management is available at `/admin/users`. Admins can search, view, modify, and delete user accounts.

## Features

### Search
- Search by email, username, or name
- Pagination (20 users per page)

### User Information Displayed
- Name/username/email
- Role (USER, CREATOR, MERCHANT, ADMIN)
- Trust level (NEW, BASIC, ESTABLISHED, TRUSTED)
- Strike count
- Ban status (Active/Banned)
- Join date

### Actions

#### Change Role
- Toggle between USER and ADMIN
- Can also set CREATOR role
- `PATCH /api/admin/users` with `action: "change_role"`

#### Apply Strike
- Adds a strike to the user's record
- Triggers escalating consequences:
  - 1st: Warning
  - 2nd: 7-day upload ban
  - 3rd: 30-day upload ban
  - 4th: Permanent ban
- `PATCH /api/admin/users` with `action: "apply_strike"`

#### Reset Strikes
- Clears strike count to 0
- Only visible when user has strikes
- `PATCH /api/admin/users` with `action: "reset_strikes"`

#### Ban / Unban
- Ban: Sets `bannedUntil` to 2099-12-31 (permanent)
- Unban: Clears `bannedUntil`
- `PATCH /api/admin/users` with `action: "ban"` or `"unban"`

#### Delete User
- Permanently deletes the user and ALL associated data
- Cannot delete your own admin account
- Requires double confirmation (click Delete, then Confirm Delete)
- `DELETE /api/admin/users?userId={id}`
- **Cascaded data**: videos, products, events, follows, saved items, carts, commissions, reports, creator applications, admin messages

## API Reference

### GET /api/admin/users
Query params: `page`, `pageSize`, `search`

Response:
```json
{
  "users": [{ "id", "email", "username", "name", "role", "trustLevel", "strikeCount", "bannedUntil", "createdAt" }],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

### PATCH /api/admin/users
Body: `{ "userId": "...", "action": "change_role|apply_strike|reset_strikes|ban|unban", "role?": "ADMIN|USER|CREATOR" }`

### DELETE /api/admin/users?userId={id}
Response: `{ "success": true, "action": "user_deleted", "deletedUser": { "id", "email" } }`
