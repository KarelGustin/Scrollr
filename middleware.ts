import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — allow access without auth
  if (
    pathname.startsWith("/@") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/events") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/categories") ||
    pathname.startsWith("/api/search") ||
    pathname.startsWith("/api/feed") ||
    pathname.startsWith("/api/cart") ||
    pathname.startsWith("/api/merchant-products") ||
    pathname.startsWith("/api/store") ||
    pathname.startsWith("/store") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/" ||
    pathname === "/search" ||
    pathname === "/discover" ||
    pathname === "/checkout" ||
    pathname === "/onboarding" ||
    pathname === "/apply" ||
    pathname === "/merchant-register" ||
    pathname === "/merchant-onboarding" ||
    pathname === "/for-merchants" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Create Supabase client with cookie access
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — require auth
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/earnings") ||
    pathname.startsWith("/feed") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/merchant") ||
    pathname.startsWith("/api/merchant/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/consumer") ||
    pathname.startsWith("/api/follows") ||
    pathname.startsWith("/api/saved") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/earnings") ||
    pathname.startsWith("/api/stripe/connect") ||
    pathname.startsWith("/api/refunds") ||
    pathname.startsWith("/api/shopify/callback")
  ) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
