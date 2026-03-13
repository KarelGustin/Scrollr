import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { buyerUserId: user.id },
        { buyerEmail: user.email },
      ],
    },
    include: {
      items: {
        include: {
          merchantProduct: {
            select: { title: true, imageUrl: true, price: true, currency: true },
          },
        },
      },
      merchant: {
        select: { storeName: true, storeLogoUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
