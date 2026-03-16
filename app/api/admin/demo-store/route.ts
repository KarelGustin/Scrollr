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

const DEMO_PRODUCTS = [
  { title: "Classic White Tee", price: 29.99, compareAtPrice: 39.99, productType: "T-Shirts", vendor: "Demo Brand Store", tags: "basics, cotton, white", description: "Premium 100% organic cotton t-shirt. Relaxed fit with a classic crew neck. Perfect for everyday wear.", inventoryQuantity: 150, sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { title: "Vintage Denim Jacket", price: 89.99, compareAtPrice: 119.99, productType: "Outerwear", vendor: "Demo Brand Store", tags: "denim, vintage, jacket", description: "Authentic vintage-wash denim jacket with brass button closure. Classic trucker silhouette.", inventoryQuantity: 75, sizes: ["S", "M", "L", "XL"] },
  { title: "Essential Hoodie - Midnight", price: 59.99, compareAtPrice: null, productType: "Hoodies", vendor: "Demo Brand Store", tags: "hoodie, fleece, comfort", description: "Ultra-soft brushed fleece hoodie with kangaroo pocket. Ribbed cuffs and hem for a snug fit.", inventoryQuantity: 120, sizes: ["S", "M", "L", "XL", "XXL"] },
  { title: "Slim Fit Chinos - Olive", price: 49.99, compareAtPrice: 64.99, productType: "Pants", vendor: "Demo Brand Store", tags: "chinos, slim, olive", description: "Tailored slim-fit chinos in olive green. Stretch cotton twill for all-day comfort.", inventoryQuantity: 90, sizes: ["28", "30", "32", "34", "36"] },
  { title: "Crossbody Mini Bag", price: 34.99, compareAtPrice: null, productType: "Accessories", vendor: "Demo Brand Store", tags: "bag, crossbody, vegan", description: "Compact crossbody bag in vegan leather. Adjustable strap with gold-tone hardware.", inventoryQuantity: 200 },
  { title: "Running Sneakers - Cloud", price: 79.99, compareAtPrice: 99.99, productType: "Footwear", vendor: "Demo Brand Store", tags: "sneakers, running, comfort", description: "Lightweight mesh running sneakers with responsive foam sole. Breathable and flexible.", inventoryQuantity: 60, sizes: ["7", "8", "9", "10", "11", "12"] },
  { title: "Oversized Sunglasses", price: 24.99, compareAtPrice: 34.99, productType: "Accessories", vendor: "Demo Brand Store", tags: "sunglasses, UV, fashion", description: "Oversized square-frame sunglasses with UV400 protection. Gradient tinted lenses.", inventoryQuantity: 300 },
  { title: "Ribbed Tank Top - Sand", price: 19.99, compareAtPrice: null, productType: "T-Shirts", vendor: "Demo Brand Store", tags: "tank, ribbed, basics", description: "Fitted ribbed tank top in warm sand tone. Perfect layering piece or standalone summer essential.", inventoryQuantity: 180, sizes: ["XS", "S", "M", "L", "XL"] },
  { title: "Cargo Joggers - Black", price: 54.99, compareAtPrice: 69.99, productType: "Pants", vendor: "Demo Brand Store", tags: "joggers, cargo, streetwear", description: "Modern cargo joggers with utility pockets. Elastic waistband with drawstring closure.", inventoryQuantity: 100, sizes: ["S", "M", "L", "XL"] },
  { title: "Leather Belt - Cognac", price: 29.99, compareAtPrice: null, productType: "Accessories", vendor: "Demo Brand Store", tags: "belt, leather, classic", description: "Full-grain leather belt with brushed nickel buckle. 1.25 inch width, classic dress style.", inventoryQuantity: 250 },
  { title: "Puffer Vest - Navy", price: 69.99, compareAtPrice: 89.99, productType: "Outerwear", vendor: "Demo Brand Store", tags: "vest, puffer, winter", description: "Lightweight packable puffer vest with synthetic fill. Water-resistant shell fabric.", inventoryQuantity: 80, sizes: ["S", "M", "L", "XL"] },
  { title: "Graphic Tee - Sunset", price: 34.99, compareAtPrice: null, productType: "T-Shirts", vendor: "Demo Brand Store", tags: "graphic, vintage, cotton", description: "Vintage-inspired graphic tee with sunset print. Pre-washed soft cotton for a lived-in feel.", inventoryQuantity: 140, sizes: ["S", "M", "L", "XL"] },
  { title: "Wide Leg Trousers - Cream", price: 64.99, compareAtPrice: 79.99, productType: "Pants", vendor: "Demo Brand Store", tags: "trousers, wide-leg, elegant", description: "High-waisted wide-leg trousers in cream. Pleated front with pressed crease detail.", inventoryQuantity: 70, sizes: ["XS", "S", "M", "L"] },
  { title: "Canvas Tote Bag", price: 22.99, compareAtPrice: null, productType: "Accessories", vendor: "Demo Brand Store", tags: "tote, canvas, everyday", description: "Heavy-duty canvas tote with interior pocket. Reinforced handles for durability.", inventoryQuantity: 400 },
  { title: "Knit Beanie - Charcoal", price: 18.99, compareAtPrice: 24.99, productType: "Accessories", vendor: "Demo Brand Store", tags: "beanie, knit, winter", description: "Soft ribbed knit beanie in charcoal. One size fits most with stretch-fit design.", inventoryQuantity: 220 },
  { title: "Linen Button-Up Shirt", price: 54.99, compareAtPrice: 69.99, productType: "Shirts", vendor: "Demo Brand Store", tags: "linen, button-up, summer", description: "Relaxed-fit linen shirt with mother-of-pearl buttons. Perfect for warm weather.", inventoryQuantity: 95, sizes: ["S", "M", "L", "XL"] },
  { title: "High-Top Sneakers - White", price: 84.99, compareAtPrice: 109.99, productType: "Footwear", vendor: "Demo Brand Store", tags: "sneakers, high-top, classic", description: "Classic high-top sneakers in crisp white leather. Cushioned insole and vulcanized sole.", inventoryQuantity: 55, sizes: ["7", "8", "9", "10", "11", "12"] },
  { title: "Corduroy Overshirt - Rust", price: 74.99, compareAtPrice: null, productType: "Outerwear", vendor: "Demo Brand Store", tags: "corduroy, overshirt, layering", description: "Heavyweight corduroy overshirt in warm rust. Button-front with chest pockets.", inventoryQuantity: 65, sizes: ["S", "M", "L", "XL"] },
  { title: "Sport Watch - Matte Black", price: 44.99, compareAtPrice: 59.99, productType: "Accessories", vendor: "Demo Brand Store", tags: "watch, sport, digital", description: "Digital sport watch with stopwatch, alarm, and backlight. Water-resistant to 50m.", inventoryQuantity: 130 },
  { title: "Relaxed Shorts - Stone", price: 39.99, compareAtPrice: null, productType: "Shorts", vendor: "Demo Brand Store", tags: "shorts, relaxed, summer", description: "Relaxed-fit shorts in stone cotton twill. 7-inch inseam with side pockets.", inventoryQuantity: 110, sizes: ["S", "M", "L", "XL"] },
];

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const storeName = body.storeName || "Demo Brand Store";
  const slug = body.slug || "demo-brand-store";

  // Check if demo store already exists
  const existing = await prisma.merchant.findFirst({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Demo store already exists. Delete it first or use a different slug." },
      { status: 409 }
    );
  }

  try {
  // Create demo merchant user
  const username = slug.replace(/-/g, "") + Math.floor(Math.random() * 999);
  const merchantUser = await prisma.user.create({
    data: {
      email: `${slug}@demo.scrollr.io`,
      username,
      name: storeName,
      role: "MERCHANT",
    },
  });

  // Create merchant
  const merchant = await prisma.merchant.create({
    data: {
      userId: merchantUser.id,
      shopifyDomain: `${slug}.myshopify.com`,
      shopifyAccessToken: `demo_tok_${Date.now()}`,
      storeName,
      slug,
      storeDescription: `Welcome to ${storeName}! Browse our curated collection of premium fashion essentials.`,
      storeTheme: "light",
      shippingPolicy: "Free shipping on orders over $50. Standard shipping (3-5 business days) is $5.99. Express shipping (1-2 business days) is $12.99.",
      returnPolicy: "30-day hassle-free returns. Items must be unworn with tags attached. Free return shipping on exchanges.",
      active: true,
    },
  });

  // Create 20 demo products
  const createdProducts = [];
  for (let i = 0; i < DEMO_PRODUCTS.length; i++) {
    const p = DEMO_PRODUCTS[i];
    const encodedTitle = encodeURIComponent(p.title.replace(/ /g, "+"));
    const colors = ["1a1a2e", "2d3436", "636e72", "0984e3", "6c5ce7", "d63031", "e17055", "00b894"];
    const bgColor = colors[i % colors.length];

    const product = await prisma.merchantProduct.create({
      data: {
        merchantId: merchant.id,
        shopifyProductId: `demo_${Date.now()}_${i}`,
        shopifyVariantId: `demo_var_${Date.now()}_${i}`,
        title: p.title,
        description: p.description,
        imageUrl: `https://placehold.co/600x600/${bgColor}/ffffff?text=${encodedTitle}`,
        images: [
          `https://placehold.co/600x600/${bgColor}/ffffff?text=${encodedTitle}`,
          `https://placehold.co/600x600/${bgColor}/ffffff?text=${encodedTitle}+2`,
        ],
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        currency: "USD",
        inventoryQuantity: p.inventoryQuantity,
        available: true,
        productType: p.productType,
        vendor: p.vendor,
        tags: p.tags,
      },
    });

    // Also create a linked Product record for video tagging
    const linkedProduct = await prisma.product.create({
      data: {
        userId: merchantUser.id,
        name: p.title,
        brand: p.vendor,
        price: p.price,
        priceDisplay: `$${p.price.toFixed(2)}`,
        imageUrl: `https://placehold.co/600x600/${bgColor}/ffffff?text=${encodedTitle}`,
        description: p.description,
        affiliateUrl: `/store/${slug}`,
        sizes: p.sizes ? JSON.stringify(p.sizes) : undefined,
        tags: p.tags,
        published: true,
      },
    });

    // Link merchant product to product
    await prisma.merchantProduct.update({
      where: { id: product.id },
      data: { productId: linkedProduct.id },
    });

    createdProducts.push(product);
  }

  return NextResponse.json({
    success: true,
    merchant: {
      id: merchant.id,
      slug: merchant.slug,
      storeName: merchant.storeName,
    },
    productsCreated: createdProducts.length,
    storeUrl: `/store/${slug}`,
  });
  } catch (error) {
    console.error("Failed to create demo store:", error);
    return NextResponse.json({ error: "Failed to create demo store" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "demo-brand-store";

  const merchant = await prisma.merchant.findFirst({
    where: { slug },
    select: { id: true, userId: true },
  });

  if (!merchant) {
    return NextResponse.json({ error: "Demo store not found" }, { status: 404 });
  }

  // Delete merchant (cascades to products)
  await prisma.merchant.delete({ where: { id: merchant.id } });
  // Delete the demo user
  await prisma.user.delete({ where: { id: merchant.userId } }).catch(() => {});

  return NextResponse.json({ success: true, action: "demo_store_deleted" });
}
