import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MerchantStore from "@/components/store/MerchantStore";

interface PageProps {
  params: Promise<{ merchantId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { merchantId } = await params;
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { storeName: true },
  });
  return { title: merchant ? `${merchant.storeName} - Scrollr` : "Store - Scrollr" };
}

export default async function MerchantStorePage({ params }: PageProps) {
  const { merchantId } = await params;

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId, active: true },
    select: {
      id: true,
      storeName: true,
      storeLogoUrl: true,
      shippingPolicy: true,
      returnPolicy: true,
    },
  });

  if (!merchant) {
    notFound();
  }

  const products = await prisma.merchantProduct.findMany({
    where: {
      merchantId,
      available: true,
    },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      images: true,
      price: true,
      compareAtPrice: true,
      currency: true,
      productType: true,
      vendor: true,
      inventoryQuantity: true,
      available: true,
      tags: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Extract distinct product types for category filtering
  const categories = Array.from(
    new Set(
      products
        .map((p) => p.productType)
        .filter((t): t is string => t !== null && t.trim() !== "")
    )
  ).sort();

  return <MerchantStore merchant={merchant} products={products} categories={categories} />;
}
