import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCart } from "@/lib/cart";

export async function GET() {
  const { cart, sessionId, isNew } = await getOrCreateCart();

  const response = NextResponse.json(cart);
  if (isNew) {
    response.cookies.set("cart_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  return response;
}

export async function POST(req: NextRequest) {
  const { cart, sessionId, isNew } = await getOrCreateCart();
  const body = await req.json();
  const { productId, quantity = 1 } = body;

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Upsert cart item
  const item = await prisma.cartItem.upsert({
    where: {
      cartId_productId: { cartId: cart.id, productId },
    },
    update: {
      quantity: { increment: quantity },
    },
    create: {
      cartId: cart.id,
      productId,
      quantity,
    },
    include: {
      product: {
        include: {
          user: {
            select: { id: true, username: true, name: true },
          },
        },
      },
    },
  });

  const response = NextResponse.json(item, { status: 201 });
  if (isNew) {
    response.cookies.set("cart_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export async function DELETE() {
  const { cart } = await getOrCreateCart();

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return NextResponse.json({ success: true });
}
