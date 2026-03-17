import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StripeConnectBanner } from "@/components/merchant/StripeConnectBanner";
import { DashboardStats } from "@/components/merchant/DashboardStats";
import { RecentOrders } from "@/components/merchant/RecentOrders";
import { TopProducts } from "@/components/merchant/TopProducts";
import { TopUGC } from "@/components/merchant/TopUGC";
import MerchantSyncIndicator from "@/components/merchant/MerchantSyncIndicator";

export default async function MerchantOverview() {
  const user = await getUser();
  if (!user) redirect("/login");

  const merchant = await prisma.merchant.findUnique({
    where: { userId: user.id },
    include: {
      orders: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });

  if (!merchant) redirect("/");

  const totalRevenue = merchant.orders.reduce((sum, o) => sum + (o.subtotal * 0.85), 0);
  const orderCount = merchant.orders.length;

  const stats = [
    { label: "Revenue", value: `€${totalRevenue.toFixed(0)}` },
    { label: "Orders", value: String(orderCount) },
    { label: "Conversion", value: "—" },
    { label: "Creators", value: "—" },
  ];

  // Serialize orders for client components (converts Date objects to strings)
  const serializedOrders = JSON.parse(JSON.stringify(merchant.orders)).map(
    (order: Record<string, unknown> & { items: { id: string }[] }) => ({
      ...order,
      orderItems: order.items,
    })
  );

  return (
    <div className="max-w-5xl">
      {!merchant.stripeConnectOnboarded && <StripeConnectBanner />}

      {/* Sync progress indicator */}
      {(merchant.syncStatus === "SYNCING" || merchant.syncStatus === "FAILED") && (
        <MerchantSyncIndicator initialStatus={merchant.syncStatus} />
      )}

      <h1 className="text-xl font-bold text-[#1a1a1a] mb-1">
        Good morning, {merchant.storeName}
      </h1>
      <p className="text-sm text-[#999] mb-6">Here&apos;s how your Scrollr storefront is performing</p>

      <DashboardStats stats={stats} />

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <RecentOrders orders={serializedOrders} />
        <TopProducts merchantId={merchant.id} />
      </div>

      <TopUGC merchantId={merchant.id} />
    </div>
  );
}
