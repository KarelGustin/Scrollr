import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FIRST_NAMES = ["Alex", "Jordan", "Sam", "Riley", "Taylor", "Morgan", "Casey", "Avery", "Quinn", "Dakota"];
const LAST_NAMES = ["Chen", "Rivera", "Kim", "Singh", "Patel", "Anderson", "Lee", "Garcia", "Wilson", "Brooks"];
const BIOS = [
  "Fashion lover sharing daily fits",
  "Beauty tips and product reviews",
  "Tech reviews and unboxings",
  "Fitness journey and workout tips",
  "Home decor and DIY projects",
  "Foodie exploring flavors",
  "Art and creative inspiration",
  "Lifestyle and wellness content",
];
const CATEGORIES = ["fashion", "beauty", "tech", "fitness", "food", "home", "art", "other"];
const PRODUCT_NAMES = [
  "Classic Tee", "Running Shoes", "Wireless Earbuds", "Face Serum", "Plant Pot",
  "Yoga Mat", "Crossbody Bag", "Lip Gloss Set", "Phone Stand", "Candle Set",
  "Sneakers", "Sunglasses", "Watch", "Hoodie", "Water Bottle",
];

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { count = 5, role = "CREATOR", withContent = true } = body as {
    count?: number;
    role?: "USER" | "CREATOR";
    withContent?: boolean;
  };

  const clampedCount = Math.min(50, Math.max(1, count));
  const created: { id: string; email: string; username: string; role: string }[] = [];

  for (let i = 0; i < clampedCount; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const suffix = Math.floor(Math.random() * 9999);
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${suffix}`;
    const email = `${username}@dummy.scrollr.io`;

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        name: `${firstName} ${lastName}`,
        bio: BIOS[Math.floor(Math.random() * BIOS.length)],
        role: role === "CREATOR" ? "CREATOR" : "USER",
      },
    });

    if (withContent && role === "CREATOR") {
      // Create 3-5 products per creator
      const productCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < productCount; j++) {
        const productName = PRODUCT_NAMES[Math.floor(Math.random() * PRODUCT_NAMES.length)];
        const price = Math.round((9.99 + Math.random() * 90) * 100) / 100;
        await prisma.product.create({
          data: {
            userId: newUser.id,
            name: `${productName} by ${firstName}`,
            brand: `${firstName}'s Brand`,
            price,
            priceDisplay: `$${price.toFixed(2)}`,
            affiliateUrl: `https://example.com/product/${j}`,
            tags: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
            published: true,
          },
        });
      }
    }

    created.push({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username!,
      role: newUser.role,
    });
  }

  return NextResponse.json({ created, count: created.length }, { status: 201 });
}
