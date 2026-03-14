import { NextRequest, NextResponse } from "next/server";
import { getMerchant } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, merchantId: merchant.id },
    include: {
      items: {
        include: {
          merchantProduct: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              price: true,
              sku: true,
              vendor: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, trackingNumber, trackingUrl } = body;

  // Verify the order belongs to this merchant
  const order = await prisma.order.findFirst({
    where: { id, merchantId: merchant.id },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const validStatuses = ["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(trackingUrl !== undefined && { trackingUrl }),
    },
  });

  return NextResponse.json(updated);
}
