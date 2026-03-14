import { getUser } from "./auth";
import { prisma } from "./prisma";

export async function getMerchant() {
  const user = await getUser();
  if (!user) return null;
  return prisma.merchant.findUnique({ where: { userId: user.id } });
}
