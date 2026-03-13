import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Scrollr/1.0)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
    }

    const html = await res.text();

    // Extract Open Graph and meta tags
    const getMetaContent = (property: string): string | null => {
      const patterns = [
        new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, "i"),
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"),
        new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, "i"),
      ];
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return match[1];
      }
      return null;
    };

    const getTitle = (): string | null => {
      const ogTitle = getMetaContent("og:title");
      if (ogTitle) return ogTitle;
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      return titleMatch?.[1]?.trim() ?? null;
    };

    const name = getTitle();
    const description = getMetaContent("og:description") ?? getMetaContent("description");
    const imageUrl = getMetaContent("og:image");
    const price = getMetaContent("og:price:amount") ?? getMetaContent("product:price:amount");
    const brand = getMetaContent("og:brand") ?? getMetaContent("product:brand");

    return NextResponse.json({
      name: name ?? "Unnamed Product",
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      price: price ?? null,
      brand: brand ?? null,
      affiliateUrl: url,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to scrape product details" },
      { status: 500 }
    );
  }
}
