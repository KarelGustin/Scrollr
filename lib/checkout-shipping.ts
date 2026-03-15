import { prisma } from "@/lib/prisma";
import { getShippingRates } from "@/lib/shopify";

export type CheckoutAddressInput = {
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type ShippingOption = {
  name: string;
  price: number;
  minDays: number | null;
  maxDays: number | null;
};

export const FALLBACK_SHIPPING_RATES: ShippingOption[] = [
  {
    name: "Standard Shipping",
    price: 5.99,
    minDays: 5,
    maxDays: 10,
  },
  {
    name: "Express Shipping",
    price: 12.99,
    minDays: 2,
    maxDays: 4,
  },
];

export function normalizeAddress(
  address: unknown
): CheckoutAddressInput | null {
  if (!address || typeof address !== "object") return null;
  const candidate = address as Record<string, unknown>;
  const address1 = String(candidate.address1 ?? "").trim();
  const city = String(candidate.city ?? "").trim();
  const state = String(candidate.state ?? "").trim();
  const zip = String(candidate.zip ?? "").trim();
  const country = String(candidate.country ?? "").trim();

  if (!address1 || !city || !state || !zip || !country) return null;
  return { address1, city, state, zip, country };
}

export function normalizeShippingOptionName(option: unknown): string | null {
  if (!option || typeof option !== "object") return null;
  const name = String((option as Record<string, unknown>).name ?? "").trim();
  return name || null;
}

/**
 * Computes combined shipping options for the given cart items.
 * Rates with the same name are merged by summing prices.
 */
export async function calculateShippingRatesForCart(
  cartItems: Array<{
    merchantProductId: string | null;
    quantity: number;
  }>,
  address: CheckoutAddressInput
): Promise<ShippingOption[]> {
  const merchantProductIds = cartItems
    .filter((item) => item.merchantProductId)
    .map((item) => item.merchantProductId as string);

  if (merchantProductIds.length === 0) {
    return [...FALLBACK_SHIPPING_RATES];
  }

  const merchantProducts = await prisma.merchantProduct.findMany({
    where: { id: { in: merchantProductIds } },
    include: {
      merchant: {
        select: {
          id: true,
          shopifyDomain: true,
          shopifyAccessToken: true,
        },
      },
    },
  });

  const merchantGroups = new Map<
    string,
    {
      domain: string;
      accessToken: string;
      lineItems: { variant_id: number; quantity: number }[];
    }
  >();

  for (const mp of merchantProducts) {
    const cartItem = cartItems.find((i) => i.merchantProductId === mp.id);
    if (!cartItem) continue;

    if (!merchantGroups.has(mp.merchant.id)) {
      merchantGroups.set(mp.merchant.id, {
        domain: mp.merchant.shopifyDomain,
        accessToken: mp.merchant.shopifyAccessToken,
        lineItems: [],
      });
    }

    const group = merchantGroups.get(mp.merchant.id)!;
    const variantId = mp.shopifyVariantId
      ? parseInt(mp.shopifyVariantId, 10)
      : parseInt(mp.shopifyProductId, 10);

    if (!Number.isFinite(variantId)) continue;

    group.lineItems.push({
      variant_id: variantId,
      quantity: cartItem.quantity,
    });
  }

  const allRates: ShippingOption[] = [];
  const merchantEntries = Array.from(merchantGroups.values());
  for (const group of merchantEntries) {
    try {
      const shopifyRates = await getShippingRates(
        group.domain,
        group.accessToken,
        {
          address1: address.address1,
          city: address.city,
          province: address.state,
          zip: address.zip,
          country: address.country,
        },
        group.lineItems
      );

      for (const rate of shopifyRates) {
        const price = parseFloat(rate.price);
        if (!Number.isFinite(price)) continue;

        const existing = allRates.find((r) => r.name === rate.name);
        if (existing) {
          existing.price += price;
        } else {
          allRates.push({
            name: rate.name,
            price,
            minDays: rate.min_delivery_days,
            maxDays: rate.max_delivery_days,
          });
        }
      }
    } catch {
      // Ignore merchant-level failures; fallback handles full failure.
    }
  }

  if (allRates.length === 0) {
    return [...FALLBACK_SHIPPING_RATES];
  }

  allRates.sort((a, b) => a.price - b.price);
  return allRates;
}
