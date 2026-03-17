import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET: Check for existing merchant application
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const application = await prisma.merchantApplication.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!application) {
    return NextResponse.json(null);
  }

  return NextResponse.json(application);
}

/**
 * POST: Submit a merchant application
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Already a merchant
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role === "MERCHANT") {
    return NextResponse.json(
      { error: "You are already registered as a merchant" },
      { status: 400 }
    );
  }

  // Check for pending application
  const existing = await prisma.merchantApplication.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have a pending application" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { storeName, storeUrl, storeType, category, description, monthlyRevenue, socialLinks } = body;

  if (!storeName || !storeType || !category || !description) {
    return NextResponse.json(
      { error: "Store name, type, category, and description are required" },
      { status: 400 }
    );
  }

  if (storeName.length > 100) {
    return NextResponse.json(
      { error: "Store name must be under 100 characters" },
      { status: 400 }
    );
  }

  if (description.length > 500) {
    return NextResponse.json(
      { error: "Description must be under 500 characters" },
      { status: 400 }
    );
  }

  const application = await prisma.merchantApplication.create({
    data: {
      userId: user.id,
      storeName: storeName.trim(),
      storeUrl: storeUrl?.trim() || null,
      storeType,
      category,
      description: description.trim(),
      monthlyRevenue: monthlyRevenue || null,
      socialLinks: socialLinks || null,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
