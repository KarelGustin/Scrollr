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
  const { productId, merchantProductId, selectedSize, videoId, quantity = 1 } = body;

  if (!productId && !merchantProductId) {
    return NextResponse.json(
      { error: "productId or merchantProductId is required" },
      { status: 400 }
    );
  }

  const cartItemInclude = {
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
  };

  // Handle merchant product path
  if (merchantProductId) {
    const mp = await prisma.merchantProduct.findUnique({
      where: { id: merchantProductId },
      select: { id: true, available: true },
    });

    if (!mp || !mp.available) {
      return NextResponse.json({ error: "Merchant product not found" }, { status: 404 });
    }

    const item = await prisma.cartItem.upsert({
      where: {
        cartId_merchantProductId_selectedSize: {
          cartId: cart.id,
          merchantProductId,
          selectedSize: selectedSize ?? null,
        },
      },
      update: {
        quantity: { increment: quantity },
        // Update videoId if a new one is provided (latest attribution wins)
        ...(videoId ? { videoId } : {}),
      },
      create: {
        cartId: cart.id,
        merchantProductId,
        selectedSize: selectedSize ?? null,
        videoId: videoId ?? null,
        quantity,
      },
      include: cartItemInclude,
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

  // Handle legacy product path
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

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
    include: cartItemInclude,
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
