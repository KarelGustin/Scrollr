import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateProduct } from "@/lib/planLimits";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { userId: user.id },
    include: { video: true },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await canCreateProduct(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Product limit reached for your plan" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, brand, price, affiliateUrl, description, videoId } = body;

  if (!name || !affiliateUrl) {
    return NextResponse.json(
      { error: "Name and affiliateUrl are required" },
      { status: 400 }
    );
  }

  // Validate affiliate URL
  try {
    const url = new URL(affiliateUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return NextResponse.json(
        { error: "affiliateUrl must use http or https" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid affiliateUrl" },
      { status: 400 }
    );
  }

  // Get next position
  const lastProduct = await prisma.product.findFirst({
    where: { userId: user.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = (lastProduct?.position ?? -1) + 1;

  const product = await prisma.product.create({
    data: {
      userId: user.id,
      name,
      brand: brand ?? null,
      price: price ?? null,
      description: description ?? null,
      affiliateUrl,
      position,
      ...(videoId
        ? {
            video: {
              connect: { id: videoId },
            },
          }
        : {}),
    },
    include: { video: true },
  });

  return NextResponse.json(product, { status: 201 });
}
