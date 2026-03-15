import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { lookup } from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
]);
const ALLOWED_PORTS = new Set(["", "80", "443"]);

function isPrivateIpv4(ip: string): boolean {
  const [a, b] = ip.split(".").map((part) => Number(part));
  if (!Number.isInteger(a) || !Number.isInteger(b)) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIpAddress(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIpv4(ip);
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.replace("::ffff:", "");
      if (net.isIPv4(mapped)) return isPrivateIpv4(mapped);
    }
    return (
      normalized === "::1" ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd")
    );
  }
  return true;
}

async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP(S) URLs are allowed");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Credentials in URL are not allowed");
  }
  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw new Error("Unsupported port");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Local addresses are not allowed");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      throw new Error("Private IPs are not allowed");
    }
    return parsed;
  }

  const records = await lookup(hostname, { all: true });
  if (!records.length) {
    throw new Error("Unable to resolve host");
  }

  if (records.some((record) => isPrivateIpAddress(record.address))) {
    throw new Error("Host resolves to private IP");
  }

  return parsed;
}

async function safeFetchHtml(initialUrl: string): Promise<string> {
  let current = await assertSafePublicUrl(initialUrl);

  for (let i = 0; i < 3; i++) {
    const res = await fetch(current.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Invalid redirect");
      current = await assertSafePublicUrl(new URL(location, current).toString());
      continue;
    }

    if (!res.ok) throw new Error("Failed to fetch URL");

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("URL did not return HTML");
    }

    return res.text();
  }

  throw new Error("Too many redirects");
}

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
    await assertSafePublicUrl(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const html = await safeFetchHtml(url);

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
