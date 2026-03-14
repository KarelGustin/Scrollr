/**
 * Shopify Integration for Scrollr
 *
 * Handles:
 * - Product sync from merchant Shopify stores
 * - Shipping rate fetching
 * - Order creation on merchant stores after payment
 */

const SHOPIFY_API_VERSION = "2024-10";

type ShopifyRequestOptions = {
  domain: string;
  accessToken: string;
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

async function shopifyRequest<T>({
  domain,
  accessToken,
  endpoint,
  method = "GET",
  body,
}: ShopifyRequestOptions): Promise<T> {
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Make a Shopify request and return both data and Link header for pagination.
 */
async function shopifyRequestWithHeaders<T>({
  domain,
  accessToken,
  endpoint,
  method = "GET",
  body,
}: ShopifyRequestOptions): Promise<{ data: T; linkHeader: string | null }> {
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as T;
  const linkHeader = res.headers.get("link");
  return { data, linkHeader };
}

/**
 * Parse Shopify Link header to extract the "next" page URL.
 */
function parseNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

// ── Product Sync ──

export type ShopifyProduct = {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  tags: string;
  image: { src: string } | null;
  images: { src: string }[];
  variants: ShopifyVariant[];
};

export type ShopifyVariant = {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  inventory_quantity: number;
  available: boolean;
};

/**
 * Fetch all products from a Shopify store.
 * Handles pagination via Link header rel="next" cursor-based pagination.
 */
export async function fetchAllProducts(
  domain: string,
  accessToken: string
): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let endpoint: string | null = "products.json?limit=250&status=active";

  while (endpoint) {
    const { data, linkHeader } = await shopifyRequestWithHeaders<{
      products: ShopifyProduct[];
    }>({
      domain,
      accessToken,
      endpoint,
    });
    allProducts.push(...data.products);

    // Follow Link header rel="next" for cursor-based pagination
    endpoint = parseNextPageUrl(linkHeader);
  }

  return allProducts;
}

/**
 * Fetch a single product by ID.
 */
export async function fetchProduct(
  domain: string,
  accessToken: string,
  productId: string
): Promise<ShopifyProduct> {
  const data = await shopifyRequest<{ product: ShopifyProduct }>({
    domain,
    accessToken,
    endpoint: `products/${productId}.json`,
  });
  return data.product;
}

// ── Shipping Rates ──

export type ShopifyShippingRate = {
  name: string;
  price: string;
  min_delivery_days: number | null;
  max_delivery_days: number | null;
};

/**
 * Get available shipping rates for an order.
 * Creates a temporary checkout via Storefront API to fetch real rates.
 */
export async function getShippingRates(
  domain: string,
  accessToken: string,
  shippingAddress: {
    address1: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  },
  lineItems: { variant_id: number; quantity: number }[]
): Promise<ShopifyShippingRate[]> {
  // Use draft order to calculate shipping
  const draftOrder = await shopifyRequest<{
    draft_order: { id: number; shipping_line: unknown };
  }>({
    domain,
    accessToken,
    endpoint: "draft_orders.json",
    method: "POST",
    body: {
      draft_order: {
        line_items: lineItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        shipping_address: {
          address1: shippingAddress.address1,
          city: shippingAddress.city,
          province: shippingAddress.province,
          zip: shippingAddress.zip,
          country: shippingAddress.country,
        },
        use_customer_default_address: false,
      },
    },
  });

  // Fetch shipping rates for the draft order
  const rates = await shopifyRequest<{
    shipping_rates: ShopifyShippingRate[];
  }>({
    domain,
    accessToken,
    endpoint: `draft_orders/${draftOrder.draft_order.id}/shipping_rates.json`,
  });

  // Clean up the draft order
  await shopifyRequest({
    domain,
    accessToken,
    endpoint: `draft_orders/${draftOrder.draft_order.id}.json`,
    method: "DELETE",
  }).catch(() => {});

  return rates.shipping_rates ?? [];
}

// ── Order Creation ──

export type CreateOrderParams = {
  domain: string;
  accessToken: string;
  lineItems: { variant_id: number; quantity: number; price: string }[];
  shippingAddress: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string;
  };
  email: string;
  shippingLine: { title: string; price: string };
  note?: string;
  tags?: string[];
};

/**
 * Create a paid order on the merchant's Shopify store.
 * Called AFTER Stripe payment succeeds.
 */
export async function createOrder(
  params: CreateOrderParams
): Promise<{ id: number; order_number: number; name: string }> {
  const data = await shopifyRequest<{
    order: { id: number; order_number: number; name: string };
  }>({
    domain: params.domain,
    accessToken: params.accessToken,
    endpoint: "orders.json",
    method: "POST",
    body: {
      order: {
        line_items: params.lineItems,
        shipping_address: params.shippingAddress,
        email: params.email,
        financial_status: "paid",
        send_receipt: true,
        shipping_lines: [
          {
            title: params.shippingLine.title,
            price: params.shippingLine.price,
          },
        ],
        note: params.note ?? "Order via Scrollr",
        tags: ["scrollr", ...(params.tags ?? [])].join(", "),
      },
    },
  });

  return data.order;
}

// ── Store Info ──

export type ShopifyShop = {
  id: number;
  name: string;
  domain: string;
  myshopify_domain: string;
  email: string;
  money_format: string;
  currency: string;
};

/**
 * Fetch basic store information.
 */
export async function fetchShopInfo(
  domain: string,
  accessToken: string
): Promise<ShopifyShop> {
  const data = await shopifyRequest<{ shop: ShopifyShop }>({
    domain,
    accessToken,
    endpoint: "shop.json",
  });
  return data.shop;
}

// ── Webhook Registration ──

/**
 * Register webhooks so Scrollr stays in sync with the Shopify store.
 */
export async function registerWebhooks(
  domain: string,
  accessToken: string,
  callbackBase: string
): Promise<void> {
  const topics = [
    "products/update",
    "products/delete",
    "inventory_levels/update",
    "orders/fulfilled",
    "app/uninstalled",
  ];

  for (const topic of topics) {
    await shopifyRequest({
      domain,
      accessToken,
      endpoint: "webhooks.json",
      method: "POST",
      body: {
        webhook: {
          topic,
          address: `${callbackBase}/api/webhooks/shopify`,
          format: "json",
        },
      },
    }).catch(() => {
      // Webhook may already exist
    });
  }
}
