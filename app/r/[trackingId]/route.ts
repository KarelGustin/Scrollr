import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: trackingId },
    select: { affiliateUrl: true },
  });

  if (!product) {
    return NextResponse.redirect(new URL("/", req.url), {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // Record click asynchronously
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "";
  const referrer = req.headers.get("referer") ?? null;
  const visitorId = await sha256(`${ip}:${userAgent}`);

  // Fire and forget - don't block the redirect
  prisma.click
    .create({
      data: {
        productId: trackingId,
        visitorId,
        referrer,
        userAgent: userAgent || null,
      },
    })
    .catch(() => {
      // Silently ignore click recording failures
    });

  return NextResponse.redirect(product.affiliateUrl, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
