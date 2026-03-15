import { getUser } from "./auth";
import { prisma } from "./prisma";

export async function getMerchant(options?: { includeSecrets?: boolean }) {
  const user = await getUser();
  if (!user) return null;
  if (options?.includeSecrets) {
    return prisma.merchant.findUnique({ where: { userId: user.id } });
  }

  return prisma.merchant.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      userId: true,
      shopifyDomain: true,
      storeName: true,
      storeLogoUrl: true,
      shippingPolicy: true,
      returnPolicy: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      slug: true,
      storeDescription: true,
      storeTheme: true,
      stripeConnectAccountId: true,
      stripeConnectOnboarded: true,
    },
  });
}
