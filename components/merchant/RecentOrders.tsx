interface OrderItem {
  id: string;
  title?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  createdAt: string | Date;
  orderItems: OrderItem[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  FULFILLED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-green-100 text-green-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

export function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="bg-white border border-[#f0f0f0] rounded-xl p-5">
      <h3 className="text-sm font-bold text-[#1a1a1a] mb-4">Recent Orders</h3>
      {orders.length === 0 ? (
        <p className="text-sm text-[#999] py-6 text-center">No orders yet</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between py-2 border-b border-[#f5f5f5] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">#{order.orderNumber}</p>
                <p className="text-xs text-[#999] mt-0.5">
                  {order.orderItems.length} item{order.orderItems.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}>
                  {order.status}
                </span>
                <p className="text-sm font-semibold text-[#1a1a1a]">&euro;{(order.subtotal * 0.85).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
