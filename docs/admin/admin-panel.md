# Admin Panel

The admin panel is accessible at `/admin` and requires `ADMIN` role. It provides comprehensive platform management organized into sections.

## Navigation Structure

### Dashboard
- **Overview** (`/admin`) — KPI dashboard with total users, creators, merchants, revenue, orders, videos, products, and pending applications. Includes recent orders and recent users tables.

### Content & Safety
- **Content** (`/admin/content`) — Full content management with search, status filtering (Ready/Processing/Pending Review/Rejected/Error), publish/unpublish toggle, and delete with confirmation. Shows report counts and creator attribution.
- **Moderation** (`/admin/moderation`) — Queue of videos with PENDING_REVIEW status. Actions: Approve, Reject, Ban User. All actions logged.
- **Reports** (`/admin/reports`) — User-submitted reports grouped by video. Shows reason, reporter, and submission date. Actions: Dismiss, Remove Video, Ban User.

### People
- **Users** (`/admin/users`) — Full user management with search and pagination. Actions per user:
  - **Promote/Demote** — Toggle between USER/ADMIN roles
  - **Strike** — Apply a strike (escalating consequences)
  - **Reset Strikes** — Clear strike history
  - **Ban/Unban** — Permanent ban toggle
  - **Delete** — Permanently delete user and all their data (with confirmation)
- **Creators** (`/admin/creators`) — Creator-specific management and analytics
- **Applications** (`/admin/applications`) — Review creator applications. Approve or reject with admin notes.

### Commerce
- **Merchants** (`/admin/merchants`) — Merchant management with revenue tracking. Expandable detail view per merchant:
  - Edit store name, logo, policies
  - Activate/deactivate merchant
  - Manage products (add, edit, delete individual products)
  - Generate dummy products for testing
  - View storefront
  - **Delete merchant** (with confirmation)
- **Demo Store** (`/admin/demo-store`) — Create a demo brand store with 20 sample products for storefront preview. Configurable name and slug.

### Tools
- **Dummy Data** (`/admin/dummy`) — Generate test data for development
- **Upload Videos** (`/admin/upload`) — Direct video upload as admin
- **Content Seeding** (`/admin/content-seeding`) — Import/suggest test content
- **Messages** (`/admin/messages`) — Send admin messages to users
- **Market Research** (`/admin/market-research`) — Analytics and research tools

## Delete Capabilities

### Delete Users
- Endpoint: `DELETE /api/admin/users?userId={id}`
- Cascades to all user data (videos, products, events, follows, etc.)
- Cannot delete your own account
- Requires confirmation in UI

### Delete Content (Videos)
- Endpoint: `DELETE /api/admin/videos/{id}`
- Logs deletion in ModerationLog before removing
- Cascades to video products, events, reports, scores

### Delete Merchants
- Endpoint: `DELETE /api/admin/merchants?merchantId={id}`
- Cascades to merchant products and related data
- Does not delete the associated user account
- Requires confirmation in UI

## Admin Layout

- **Desktop**: Fixed left sidebar (256px) with sectioned navigation
- **Mobile**: Bottom tab bar showing first 4 items + sign out
- Sidebar shows admin avatar, name, and ADMIN badge
- Includes "Back to Dashboard" link and sign out button
