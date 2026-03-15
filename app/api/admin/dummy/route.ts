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

const MERCHANT_STORES = [
  {
    name: "Urban Thread Co.",
    type: "fashion",
    domain: "urbanthread.myshopify.com",
    logo: "https://placehold.co/100x100/1a1a2e/ffffff?text=UT",
    shipping: "Free shipping on orders over $50. Standard delivery 3-5 business days. Express shipping available at checkout.",
    returns: "30-day returns on unworn items with tags attached. Free return shipping on all domestic orders.",
    products: [
      { name: "Oversized Hoodie", price: 59.99, compare: 79.99 },
      { name: "Slim Fit Jeans", price: 49.99, compare: null },
      { name: "Graphic Tee", price: 24.99, compare: 34.99 },
      { name: "Cargo Pants", price: 54.99, compare: null },
      { name: "Bomber Jacket", price: 89.99, compare: 119.99 },
      { name: "Cropped Tank", price: 19.99, compare: null },
      { name: "Wide Leg Trousers", price: 44.99, compare: 59.99 },
      { name: "Denim Jacket", price: 74.99, compare: null },
    ],
  },
  {
    name: "Glow Essentials",
    type: "beauty",
    domain: "glowessentials.myshopify.com",
    logo: "https://placehold.co/100x100/ff6b9d/ffffff?text=GE",
    shipping: "Free standard shipping on all orders. Delivery in 2-4 business days.",
    returns: "14-day satisfaction guarantee. Unopened items can be returned for a full refund.",
    products: [
      { name: "Vitamin C Serum", price: 34.99, compare: 44.99 },
      { name: "Hydrating Moisturizer", price: 28.99, compare: null },
      { name: "Clay Face Mask", price: 18.99, compare: 24.99 },
      { name: "Lip Oil Set", price: 22.99, compare: null },
      { name: "Setting Spray", price: 16.99, compare: null },
      { name: "Exfoliating Toner", price: 26.99, compare: 34.99 },
      { name: "Under Eye Patches", price: 12.99, compare: null },
      { name: "Hair Oil Treatment", price: 32.99, compare: 42.99 },
    ],
  },
  {
    name: "TechVault",
    type: "electronics",
    domain: "techvault.myshopify.com",
    logo: "https://placehold.co/100x100/4a90d9/ffffff?text=TV",
    shipping: "Free shipping on orders over $35. Standard 3-5 day delivery. Next-day shipping available.",
    returns: "30-day return policy. Defective items replaced at no cost. Original packaging required.",
    products: [
      { name: "Wireless Earbuds Pro", price: 49.99, compare: 69.99 },
      { name: "Phone Stand Mount", price: 19.99, compare: null },
      { name: "USB-C Hub", price: 34.99, compare: 44.99 },
      { name: "LED Desk Lamp", price: 39.99, compare: null },
      { name: "Portable Charger", price: 29.99, compare: null },
      { name: "Bluetooth Speaker", price: 44.99, compare: 59.99 },
      { name: "Smart Watch Band", price: 14.99, compare: null },
      { name: "Cable Organizer", price: 12.99, compare: 16.99 },
    ],
  },
  {
    name: "FitForm Athletics",
    type: "fitness",
    domain: "fitform.myshopify.com",
    logo: "https://placehold.co/100x100/2ecc71/ffffff?text=FF",
    shipping: "Free shipping on orders over $40. Standard delivery 3-5 business days.",
    returns: "60-day return policy on unused items. Hygiene items (sports bras, socks) are final sale.",
    products: [
      { name: "Performance Leggings", price: 54.99, compare: 74.99 },
      { name: "Training Shorts", price: 34.99, compare: null },
      { name: "Sports Bra", price: 39.99, compare: 49.99 },
      { name: "Gym Bag", price: 44.99, compare: null },
      { name: "Resistance Bands Set", price: 24.99, compare: null },
      { name: "Foam Roller", price: 29.99, compare: 39.99 },
      { name: "Shaker Bottle", price: 14.99, compare: null },
      { name: "Compression Socks", price: 18.99, compare: 24.99 },
    ],
  },
  {
    name: "Casa & Co.",
    type: "home",
    domain: "casaandco.myshopify.com",
    logo: "https://placehold.co/100x100/e67e22/ffffff?text=CC",
    shipping: "Free shipping on all orders over $60. Fragile items shipped with extra care. 4-7 business days.",
    returns: "21-day return window. Items must be unused and in original packaging. Candles are final sale.",
    products: [
      { name: "Scented Candle Set", price: 34.99, compare: 44.99 },
      { name: "Throw Blanket", price: 49.99, compare: null },
      { name: "Ceramic Vase", price: 29.99, compare: 39.99 },
      { name: "Wall Art Print", price: 24.99, compare: null },
      { name: "Linen Pillowcase Set", price: 39.99, compare: null },
      { name: "Plant Pot Trio", price: 27.99, compare: 34.99 },
      { name: "Reed Diffuser", price: 22.99, compare: null },
      { name: "Cozy Slippers", price: 19.99, compare: 26.99 },
    ],
  },
];

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

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { type } = body;

  // ── Demo videos for feed ──
  if (type === "demo-videos") {
    const DEMO_VIDEOS = [
      {
        url: "https://jxztvoxjhhwghjkksuqm.supabase.co/storage/v1/object/public/lander/heroVideo.mp4",
        title: "Summer Collection Lookbook",
        description: "Check out these trending summer styles",
        category: "fashion",
        duration: 30,
        creator: { name: "Emma Style", username: "emmastyle" },
        products: [
          { name: "Oversized Linen Shirt", brand: "Urban Thread", price: 49.99, tags: "fashion" },
          { name: "High-Waist Shorts", brand: "Urban Thread", price: 39.99, tags: "fashion" },
        ],
      },
      {
        url: "https://jxztvoxjhhwghjkksuqm.supabase.co/storage/v1/object/public/lander/video2.mp4",
        title: "My Morning Skincare Routine",
        description: "Products I use every single morning for glowing skin",
        category: "beauty",
        duration: 25,
        creator: { name: "Mia Glow", username: "miaglow" },
        products: [
          { name: "Vitamin C Serum", brand: "Glow Essentials", price: 34.99, tags: "beauty" },
          { name: "Hydrating Moisturizer", brand: "Glow Essentials", price: 28.99, tags: "beauty" },
          { name: "SPF 50 Sunscreen", brand: "Glow Essentials", price: 22.99, tags: "beauty" },
        ],
      },
      {
        url: "https://jxztvoxjhhwghjkksuqm.supabase.co/storage/v1/object/public/lander/video3.mp4",
        title: "Tech Gadgets You Need",
        description: "My top 3 tech picks this month",
        category: "tech",
        duration: 20,
        creator: { name: "Luca Tech", username: "lucatech" },
        products: [
          { name: "Wireless Earbuds Pro", brand: "TechVault", price: 49.99, tags: "tech" },
          { name: "USB-C Hub 7-in-1", brand: "TechVault", price: 34.99, tags: "tech" },
        ],
      },
    ];

    const createdVideos: { id: string; title: string }[] = [];

    for (const demo of DEMO_VIDEOS) {
      // Check if creator already exists
      let creator = await prisma.user.findFirst({
        where: { username: demo.creator.username },
      });

      if (!creator) {
        creator = await prisma.user.create({
          data: {
            email: `${demo.creator.username}@demo.scrollr.io`,
            username: demo.creator.username,
            name: demo.creator.name,
            role: "CREATOR",
            bio: `Content creator on Scrollr`,
          },
        });
      }

      // Create video record
      const video = await prisma.video.create({
        data: {
          userId: creator.id,
          hlsUrl: demo.url,
          title: demo.title,
          description: demo.description,
          category: demo.category,
          duration: demo.duration,
          status: "READY",
          published: true,
        },
      });

      // Create products and link them to the video
      for (let pi = 0; pi < demo.products.length; pi++) {
        const prod = demo.products[pi];
        const product = await prisma.product.create({
          data: {
            userId: creator.id,
            name: prod.name,
            brand: prod.brand,
            price: prod.price,
            priceDisplay: `$${prod.price.toFixed(2)}`,
            imageUrl: `https://placehold.co/400x400/FF6B4A/ffffff?text=${encodeURIComponent(prod.name)}`,
            affiliateUrl: `https://example.com/shop/${encodeURIComponent(prod.name.toLowerCase().replace(/ /g, "-"))}`,
            tags: prod.tags,
            published: true,
          },
        });

        await prisma.videoProduct.create({
          data: {
            videoId: video.id,
            productId: product.id,
            position: pi,
          },
        });
      }

      createdVideos.push({ id: video.id, title: demo.title! });
    }

    return NextResponse.json(
      { created: createdVideos, count: createdVideos.length },
      { status: 201 },
    );
  }

  // ── Merchant dummy data ──
  if (type === "merchant") {
    const { count = 5 } = body as { count?: number };
    const clampedCount = Math.min(5, Math.max(1, count));
    const storesToCreate = MERCHANT_STORES.slice(0, clampedCount);

    const createdMerchants: { id: string; storeName: string; productCount: number }[] = [];

    for (let si = 0; si < storesToCreate.length; si++) {
      const store = storesToCreate[si];
      const suffix = Math.floor(Math.random() * 9999);
      const username = store.name.toLowerCase().replace(/[^a-z0-9]/g, "") + suffix;

      // Create a dummy user for this merchant
      const merchantUser = await prisma.user.create({
        data: {
          email: `${username}@merchant.scrollr.io`,
          username,
          name: store.name,
          role: "MERCHANT",
        },
      });

      // Create the merchant
      const merchant = await prisma.merchant.create({
        data: {
          userId: merchantUser.id,
          shopifyDomain: store.domain.replace(".myshopify.com", `${suffix}.myshopify.com`),
          shopifyAccessToken: `tok_dummy_${Date.now()}_${si}`,
          storeName: store.name,
          storeLogoUrl: store.logo,
          shippingPolicy: store.shipping,
          returnPolicy: store.returns,
          active: true,
        },
      });

      // Determine if this store type should have sizes
      const hasSizes = store.type === "fashion" || store.type === "fitness";
      const sizes = hasSizes ? ["XS", "S", "M", "L", "XL"] : null;

      // Create all products for this merchant
      for (let pi = 0; pi < store.products.length; pi++) {
        const prod = store.products[pi];
        const encodedName = encodeURIComponent(prod.name);
        const inventory = 5 + Math.floor(Math.random() * 196); // 5-200

        await prisma.merchantProduct.create({
          data: {
            merchantId: merchant.id,
            shopifyProductId: `dummy_${merchant.id}_${pi}`,
            title: prod.name,
            description: `${prod.name} from ${store.name}. High quality ${store.type} product.`,
            imageUrl: `https://placehold.co/400x400/1a1a2e/ffffff?text=${encodedName}`,
            price: prod.price,
            compareAtPrice: prod.compare,
            productType: store.type,
            vendor: store.name,
            tags: store.type,
            inventoryQuantity: inventory,
            available: true,
          },
        });
      }

      createdMerchants.push({
        id: merchant.id,
        storeName: store.name,
        productCount: store.products.length,
      });
    }

    return NextResponse.json({ created: createdMerchants, count: createdMerchants.length }, { status: 201 });
  }

  // ── Default: user/creator dummy data ──
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
