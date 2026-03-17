import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scrapeShopifyProduct } from "@/lib/scrape-product";

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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const url = String(body?.url ?? "").trim();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const product = await scrapeShopifyProduct(url);
    return NextResponse.json(product);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scraping failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
