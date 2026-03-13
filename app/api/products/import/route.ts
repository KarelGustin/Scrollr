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
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 400 });
    }

    const html = await res.text();

    // Extract meta tag content
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
    const price =
      getMetaContent("og:price:amount") ??
      getMetaContent("product:price:amount") ??
      getMetaContent("product:price");
    const brand =
      getMetaContent("og:brand") ??
      getMetaContent("product:brand") ??
      getMetaContent("og:site_name");
    const currency =
      getMetaContent("og:price:currency") ??
      getMetaContent("product:price:currency");

    // Try to extract sizes from JSON-LD structured data
    let sizes: string[] | null = null;
    let availability: string | null = null;

    // JSON-LD extraction (Shopify, WooCommerce, most modern stores)
    const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jsonLdMatch;
    while ((jsonLdMatch = jsonLdPattern.exec(html)) !== null) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        const product = data["@type"] === "Product" ? data : data?.["@graph"]?.find?.((item: { "@type": string }) => item["@type"] === "Product");

        if (product) {
          // Extract sizes from variants
          if (product.offers) {
            const offers = Array.isArray(product.offers)
              ? product.offers
              : product.offers["@type"] === "AggregateOffer" && Array.isArray(product.offers.offers)
              ? product.offers.offers
              : [product.offers];

            const extractedSizes: string[] = [];
            for (const offer of offers) {
              if (offer.name && /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d{1,3})/i.test(offer.name)) {
                extractedSizes.push(offer.name);
              }
              // Check availability from first offer
              if (!availability && offer.availability) {
                const avail = String(offer.availability);
                if (avail.includes("InStock")) availability = "InStock";
                else if (avail.includes("OutOfStock")) availability = "OutOfStock";
                else if (avail.includes("LimitedAvailability")) availability = "LimitedAvailability";
              }
            }
            if (extractedSizes.length > 0) {
              sizes = extractedSizes;
            }
          }

          // Fallback: check product.size
          if (!sizes && product.size) {
            const sizeVal = Array.isArray(product.size) ? product.size : [product.size];
            sizes = sizeVal.map((s: string | { name?: string }) => typeof s === "string" ? s : s?.name ?? "").filter(Boolean);
            if (sizes!.length === 0) sizes = null;
          }
        }
      } catch {
        // Invalid JSON-LD, skip
      }
    }

    // Fallback: try to extract sizes from common HTML patterns
    if (!sizes) {
      // Shopify variant selector
      const sizeOptionMatch = html.match(/["']option_?values?["']\s*:\s*\[([^\]]+)\]/i);
      if (sizeOptionMatch) {
        try {
          const parsed = JSON.parse(`[${sizeOptionMatch[1]}]`);
          if (Array.isArray(parsed) && parsed.every((v: unknown) => typeof v === "string")) {
            const sizeish = parsed.filter((v: string) => /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d{1,3})/i.test(v));
            if (sizeish.length > 0) sizes = sizeish;
          }
        } catch { /* skip */ }
      }
    }

    // Format price with currency
    let formattedPrice = price;
    if (price && currency) {
      try {
        formattedPrice = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
        }).format(parseFloat(price));
      } catch {
        formattedPrice = `${currency} ${price}`;
      }
    } else if (price && !price.includes("$") && !price.includes("€") && !price.includes("£")) {
      formattedPrice = `$${price}`;
    }

    return NextResponse.json({
      name: name ?? "Unnamed Product",
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      price: formattedPrice ?? null,
      brand: brand ?? null,
      affiliateUrl: url,
      sizes: sizes ?? null,
      availability: availability ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to scrape product details" },
      { status: 500 }
    );
  }
}
