import { cookies } from "next/headers";
import { prisma } from "./prisma";

function generateSessionId(): string {
  return crypto.randomUUID();
}

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          user: {
            select: { id: true, username: true, name: true },
          },
        },
      },
      merchantProduct: {
        include: {
          merchant: {
            select: { id: true, storeName: true, storeLogoUrl: true },
          },
        },
      },
    },
  },
} as const;

export async function getOrCreateCart() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("cart_session")?.value;

  if (sessionId) {
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: cartInclude,
    });
    if (cart) return { cart, sessionId };
  }

  // Create new cart
  sessionId = generateSessionId();
  const cart = await prisma.cart.create({
    data: { sessionId },
    include: cartInclude,
  });

  return { cart, sessionId, isNew: true };
}
