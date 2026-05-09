import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { formatMoney } from "@/lib/i18n";
import { getMockItemsWithImages } from "@/lib/local-images";
import { getSavedOrders } from "@/lib/local-orders";
import { activeRestaurantConfig, mockRestaurant } from "@/lib/mock-data";
import type { Order, OrderLineItem } from "@/types/database";

export default async function DashboardPage() {
  const [orders, menuItems] = await Promise.all([
    getSavedOrders(),
    getMockItemsWithImages(),
  ]);
  const todayOrders = orders.filter((order) => isToday(order.created_at));
  const revenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = todayOrders.filter((order) => ["New", "Preparing"].includes(order.status)).length;
  const bestSellers = getBestSellers(orders);
  const brand = activeRestaurantConfig.branding;

  return (
    <main className="min-h-screen bg-[#140b08] text-[#fff7e8]">
      <AdminNav restaurantSlug={mockRestaurant.slug} />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#d6ad60]">{brand.name} · {brand.city}</p>
            <h1 className="text-3xl font-bold text-[#fff7e8]">لوحة تحكم روما باستري</h1>
            <p className="mt-2 text-sm text-[#cdbd9f]">{brand.tagline}</p>
          </div>
          <Link className="rounded-lg bg-[#d6ad60] px-4 py-2 text-sm font-bold text-[#140b08]" href="/menu">
            Open public menu
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Today's orders" value={todayOrders.length} />
          <Stat label="Revenue" value={formatMoney(revenue, "SAR")} />
          <Stat label="Pending orders" value={pendingOrders} />
          <Stat label="Menu items" value={menuItems.length} />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-lg border border-[#d6ad60]/25 bg-[#21110d] p-5">
            <h2 className="text-xl font-bold text-[#f4d8a4]">Best sellers</h2>
            <div className="mt-4 space-y-3">
              {bestSellers.length ? (
                bestSellers.map((item, index) => (
                  <div key={item.item_id} className="flex items-center justify-between rounded-lg bg-[#140b08] px-4 py-3">
                    <div>
                      <p className="font-semibold">{item.name_ar}</p>
                      <p className="text-xs text-[#cdbd9f]">{item.name_en}</p>
                    </div>
                    <span className="rounded-full bg-[#6f1d2b] px-3 py-1 text-xs font-bold">#{index + 1} · {item.quantity}</span>
                  </div>
                ))
              ) : (
                <DashboardEmptyState />
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-[#d6ad60]/25 bg-[#21110d]">
            <div className="border-b border-[#d6ad60]/20 px-5 py-4">
              <h2 className="text-xl font-bold text-[#f4d8a4]">Latest orders</h2>
            </div>
            <div className="divide-y divide-[#d6ad60]/15">
              {orders.length ? (
                orders.slice(0, 6).map((order) => (
                  <Link key={order.id} href="/admin/orders" className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#2a1511]">
                    <div>
                      <p className="font-semibold">{order.customer_name}</p>
                      <p className="text-sm text-[#cdbd9f]">{order.items.map((item) => item.name_ar).join("، ")}</p>
                      {extractLocationLink(order.notes) ? (
                        <p className="mt-1 text-xs text-[#d6ad60]">{extractLocationLink(order.notes)}</p>
                      ) : null}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[#f4d8a4]">{formatMoney(order.total, "SAR")}</p>
                      <p className="text-sm text-[#cdbd9f]">{order.status}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-5">
                  <DashboardEmptyState />
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#d6ad60]/25 bg-[#21110d] p-5">
      <p className="text-sm font-semibold text-[#cdbd9f]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#f4d8a4]">{value}</p>
    </div>
  );
}

function DashboardEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[#d6ad60]/25 bg-[#140b08]/60 px-4 py-6 text-center">
      <p className="font-bold text-[#f4d8a4]">لا توجد طلبات بعد</p>
      <p className="mt-2 text-sm text-[#cdbd9f]">ستظهر الطلبات هنا بعد وصول أول طلب.</p>
      <div className="mx-auto my-4 h-px max-w-48 bg-gradient-to-r from-transparent via-[#d6ad60]/40 to-transparent" />
      <p className="font-bold text-[#f4d8a4]">No orders yet</p>
      <p className="mt-2 text-sm text-[#cdbd9f]">Orders will appear here after the first customer order.</p>
    </div>
  );
}

function getBestSellers(orders: Order[]) {
  const sellers = new Map<string, OrderLineItem>();

  for (const order of orders) {
    for (const item of order.items) {
      const current = sellers.get(item.item_id);
      sellers.set(item.item_id, {
        ...item,
        quantity: (current?.quantity || 0) + item.quantity,
      });
    }
  }

  return Array.from(sellers.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

function isToday(date: string) {
  return new Date(date).toDateString() === new Date().toDateString();
}

function extractLocationLink(notes: string | null) {
  return notes?.match(/https:\/\/maps\.google\.com\/\?q=[^\s|]+/)?.[0] || "";
}
