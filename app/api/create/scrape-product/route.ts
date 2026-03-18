import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

/**
 * Scrape basic product info from a URL using OG meta tags.
 * This is a legacy/temporary feature for external product linking.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = (await req.json()) as { url?: string };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Scrollr/1.0 (Product Link Preview)",
        Accept: "text/html",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "Could not fetch URL" }, { status: 400 });
    }

    const html = await res.text();

    // Extract OG meta tags
    const getMetaContent = (property: string): string | null => {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
      ];
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return match[1];
      }
      return null;
    };

    // Try to extract price from various common patterns
    const extractPrice = (): number | null => {
      const pricePatterns = [
        getMetaContent("og:price:amount"),
        getMetaContent("product:price:amount"),
        getMetaContent("twitter:data1"),
      ];
      for (const p of pricePatterns) {
        if (p) {
          const num = parseFloat(p.replace(/[^0-9.,]/g, "").replace(",", "."));
          if (!isNaN(num)) return num;
        }
      }
      return null;
    };

    const title =
      getMetaContent("og:title") ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
      parsedUrl.hostname;

    const imageUrl = getMetaContent("og:image") ?? null;
    const description = getMetaContent("og:description") ?? null;
    const siteName = getMetaContent("og:site_name") ?? parsedUrl.hostname.replace("www.", "");
    const price = extractPrice();
    const currency = getMetaContent("og:price:currency") ?? getMetaContent("product:price:currency") ?? "EUR";

    return NextResponse.json({
      title,
      imageUrl,
      description,
      siteName,
      price,
      currency,
      url: parsedUrl.href,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 408 });
    }
    return NextResponse.json({ error: "Failed to fetch product info" }, { status: 500 });
  }
}
