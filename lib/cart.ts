import { cookies } from "next/headers";
import { prisma } from "./prisma";

function generateSessionId(): string {
  return crypto.randomUUID();
}

export async function getOrCreateCart() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("cart_session")?.value;

  if (sessionId) {
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                user: {
                  select: { id: true, username: true, name: true },
                },
              },
            },
          },
        },
      },
    });
    if (cart) return { cart, sessionId };
  }

  // Create new cart
  sessionId = generateSessionId();
  const cart = await prisma.cart.create({
    data: { sessionId },
    include: {
      items: {
        include: {
          product: {
            include: {
              user: {
                select: { id: true, username: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  return { cart, sessionId, isNew: true };
}
