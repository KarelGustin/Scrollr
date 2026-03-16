# Authentication

Scrollr uses Supabase Auth for authentication with automatic Prisma user synchronization.

## Flow

1. User signs in via Supabase (Google OAuth or email/password)
2. Supabase sets a session cookie
3. On each API request, `getUser()` in `lib/auth.ts`:
   - Reads the Supabase session via `createSupabaseServerClient()`
   - Looks up (or creates) a matching Prisma `User` record by email
   - Returns the `AppUser` object with `id`, `email`, `username`, `name`, `avatarUrl`, `bio`

## Protected Routes

Routes are protected by checking the user in API handlers:

```typescript
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... handler logic
}
```

## Admin Authorization

Admin routes additionally check the database role:

```typescript
const dbUser = await prisma.user.findUnique({
  where: { id: user.id },
  select: { role: true },
});
if (dbUser?.role !== "ADMIN")
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```

## Client-Side Auth Context

The `useAuth()` hook from `lib/auth-context` provides:
- `user` — Current user object (or null)
- `status` — "loading" | "authenticated" | "unauthenticated"
- `signOut()` — Sign out function

## Route Groups

| Group | Auth Required | Role Required |
|-------|--------------|---------------|
| `(public)` | No | None |
| `(app)` | Yes | Any authenticated user |
| `(merchant)` | Yes | MERCHANT |
| `(admin)` | Yes | ADMIN |
