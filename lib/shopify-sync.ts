import { prisma } from "@/lib/prisma";
import { fetchAllProducts } from "@/lib/shopify";

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, "").trim() || null;
}

/**
 * Sync all Shopify products into MerchantProduct records.
 * Upserts by merchantId + shopifyProductId + shopifyVariantId.
 * Marks products no longer in Shopify as unavailable.
 */
export async function syncAllProducts(
  merchantId: string,
  shop: string,
  accessToken: string
): Promise<{ created: number; updated: number }> {
  // Set sync status to SYNCING
  await prisma.merchant.update({
    where: { id: merchantId },
    data: { syncStatus: "SYNCING" },
  }).catch(() => {});

  let shopifyProducts;
  try {
    shopifyProducts = await fetchAllProducts(shop, accessToken);
  } catch (err) {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { syncStatus: "FAILED" },
    }).catch(() => {});
    throw err;
  }

  let created = 0;
  let updated = 0;

  // Track all synced shopifyProductId+shopifyVariantId combos
  const syncedKeys = new Set<string>();

  for (const product of shopifyProducts) {
    const images = product.images.map((img) => img.src);
    const primaryImage = product.image?.src ?? images[0] ?? null;
    const description = stripHtml(product.body_html);
    const productUrl = `https://${shop}/products/${product.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`;

    if (product.variants.length === 0) {
      // Product with no variants — store as single record
      const key = `${product.id}:`;
      syncedKeys.add(key);

      const existing = await prisma.merchantProduct.findUnique({
        where: {
          merchantId_shopifyProductId_shopifyVariantId: {
            merchantId,
            shopifyProductId: String(product.id),
            shopifyVariantId: "",
          },
        },
      });

      if (existing) {
        await prisma.merchantProduct.update({
          where: { id: existing.id },
          data: {
            title: product.title,
            description,
            imageUrl: primaryImage,
            images: images.length > 0 ? images : undefined,
            price: 0,
            tags: product.tags || null,
            productType: product.product_type || null,
            vendor: product.vendor || null,
            productUrl,
            available: true,
          },
        });
        updated++;
      } else {
        await prisma.merchantProduct.create({
          data: {
            merchantId,
            shopifyProductId: String(product.id),
            shopifyVariantId: "",
            title: product.title,
            description,
            imageUrl: primaryImage,
            images: images.length > 0 ? images : undefined,
            price: 0,
            tags: product.tags || null,
            productType: product.product_type || null,
            vendor: product.vendor || null,
            productUrl,
            available: true,
          },
        });
        created++;
      }
      continue;
    }

    for (const variant of product.variants) {
      const key = `${product.id}:${variant.id}`;
      syncedKeys.add(key);

      const existing = await prisma.merchantProduct.findUnique({
        where: {
          merchantId_shopifyProductId_shopifyVariantId: {
            merchantId,
            shopifyProductId: String(product.id),
            shopifyVariantId: String(variant.id),
          },
        },
      });

      const data = {
        title: product.title,
        description,
        imageUrl: primaryImage,
        images: images.length > 0 ? images : undefined,
        price: parseFloat(variant.price),
        compareAtPrice: variant.compare_at_price
          ? parseFloat(variant.compare_at_price)
          : null,
        sku: variant.sku || null,
        inventoryQuantity: variant.inventory_quantity,
        available: variant.available,
        tags: product.tags || null,
        productType: product.product_type || null,
        vendor: product.vendor || null,
        productUrl,
      };

      if (existing) {
        await prisma.merchantProduct.update({
          where: { id: existing.id },
          data,
        });
        updated++;
      } else {
        await prisma.merchantProduct.create({
          data: {
            merchantId,
            shopifyProductId: String(product.id),
            shopifyVariantId: String(variant.id),
            ...data,
          },
        });
        created++;
      }
    }
  }

  // Mark products no longer in Shopify as unavailable
  const allMerchantProducts = await prisma.merchantProduct.findMany({
    where: { merchantId, available: true },
    select: { id: true, shopifyProductId: true, shopifyVariantId: true },
  });

  for (const mp of allMerchantProducts) {
    const key = `${mp.shopifyProductId}:${mp.shopifyVariantId ?? ""}`;
    if (!syncedKeys.has(key)) {
      await prisma.merchantProduct.update({
        where: { id: mp.id },
        data: { available: false },
      });
    }
  }

  // Set sync status to COMPLETE
  await prisma.merchant.update({
    where: { id: merchantId },
    data: { syncStatus: "COMPLETE" },
  }).catch(() => {});

  return { created, updated };
}
