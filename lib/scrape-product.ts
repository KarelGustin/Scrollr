/**
 * Scrape product data from a Shopify product URL using JSON-LD structured data.
 */
export interface ScrapedProduct {
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  brand: string | null;
}

export async function scrapeShopifyProduct(url: string): Promise<ScrapedProduct> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ScrollrBot/1.0)",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status}`);
  }

  const html = await res.text();

  // Extract JSON-LD blocks
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let productData: Record<string, unknown> | null = null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      // Handle both single objects and arrays
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item["@type"] === "Product") {
          productData = item;
          break;
        }
      }
      if (productData) break;
    } catch {
      // Skip invalid JSON-LD blocks
    }
  }

  if (!productData) {
    throw new Error("No Product JSON-LD found on this page. Is this a Shopify product URL?");
  }

  const title = String(productData.name ?? "Unknown Product");
  const description = String(productData.description ?? "");
  const brand =
    productData.brand && typeof productData.brand === "object"
      ? String((productData.brand as Record<string, unknown>).name ?? "")
      : typeof productData.brand === "string"
        ? productData.brand
        : null;

  // Extract images
  let images: string[] = [];
  if (Array.isArray(productData.image)) {
    images = productData.image.map(String);
  } else if (typeof productData.image === "string") {
    images = [productData.image];
  }

  // Extract price from offers
  let price = 0;
  let currency = "USD";
  const offers = productData.offers;
  if (offers) {
    const offerList = Array.isArray(offers) ? offers : [offers];
    const firstOffer = offerList[0] as Record<string, unknown> | undefined;
    if (firstOffer) {
      price = parseFloat(String(firstOffer.price ?? "0")) || 0;
      currency = String(firstOffer.priceCurrency ?? "USD");
    }
  }

  return { title, description, images, price, currency, brand };
}
