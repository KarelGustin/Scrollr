import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const user = await getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") return null;
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const products = await prisma.merchantProduct.findMany({
    where: { merchantId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const {
    title,
    description,
    imageUrl,
    price,
    compareAtPrice,
    productType,
    vendor,
    tags,
    inventoryQuantity,
    available,
    sizes,
  } = body;

  if (!title || price === undefined) {
    return NextResponse.json({ error: "title and price are required" }, { status: 400 });
  }

  // Verify merchant exists
  const merchant = await prisma.merchant.findUnique({ where: { id } });
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const shopifyProductId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const product = await prisma.merchantProduct.create({
    data: {
      merchantId: id,
      shopifyProductId,
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      productType: productType || null,
      vendor: vendor || null,
      tags: tags || null,
      inventoryQuantity: inventoryQuantity ? parseInt(inventoryQuantity) : null,
      available: available !== undefined ? available : true,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await params; // consume the param

  const body = await request.json();
  const { productId, ...updates } = body;

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  // Build update data, only including provided fields
  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.imageUrl !== undefined) data.imageUrl = updates.imageUrl;
  if (updates.price !== undefined) data.price = parseFloat(updates.price);
  if (updates.compareAtPrice !== undefined) data.compareAtPrice = updates.compareAtPrice ? parseFloat(updates.compareAtPrice) : null;
  if (updates.productType !== undefined) data.productType = updates.productType;
  if (updates.vendor !== undefined) data.vendor = updates.vendor;
  if (updates.tags !== undefined) data.tags = updates.tags;
  if (updates.inventoryQuantity !== undefined) data.inventoryQuantity = updates.inventoryQuantity ? parseInt(updates.inventoryQuantity) : null;
  if (updates.available !== undefined) data.available = updates.available;

  const product = await prisma.merchantProduct.update({
    where: { id: productId },
    data,
  });

  return NextResponse.json(product);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await params; // consume the param

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId query param is required" }, { status: 400 });
  }

  await prisma.merchantProduct.delete({
    where: { id: productId },
  });

  return NextResponse.json({ success: true });
}
