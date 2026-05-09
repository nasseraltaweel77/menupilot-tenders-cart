import { AdminNav } from "@/components/admin/AdminNav";
import { EmptyState } from "@/components/admin/EmptyState";
import { updateOrderStatus } from "@/app/admin/actions";
import { formatMoney } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv, mockRestaurant } from "@/lib/mock-data";
import { getSavedOrders } from "@/lib/local-orders";
import type { Order, OrderStatus } from "@/types/database";

const statuses: OrderStatus[] = ["New", "Paid", "Preparing", "Ready", "Delivered", "Cancelled"];

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  if (!hasSupabaseEnv()) {
    const orders = await getSavedOrders();
    return <OrdersView restaurant={mockRestaurant} orders={orders} />;
  }

  const { supabase, user } = await requireUser();
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).single();
  const { data: orders } = restaurant
    ? await supabase.from("orders").select("*").eq("restaurant_id", restaurant.id).order("created_at", { ascending: false })
    : { data: [] };

  return (
    <OrdersView
      restaurant={restaurant}
      orders={(orders || []) as Order[]}
    />
  );
}

function OrdersView({
  restaurant,
  orders,
}: {
  restaurant?: { slug: string; currency: string; phone: string | null };
  orders: Order[];
}) {
  return (
    <main className="min-h-screen bg-paper">
      <AdminNav restaurantSlug={restaurant?.slug} />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-semibold text-clay">Operations</p>
          <h1 className="text-3xl font-bold">Orders</h1>
        </div>
        <div className="grid gap-4">
          {orders.length ? (
            orders.map((order) => <OrderCard key={order.id} order={order} currency={restaurant?.currency || "SAR"} phone={restaurant?.phone || ""} />)
          ) : (
            <EmptyState title="No orders yet" body="Public menu orders will appear here as soon as customers check out." />
          )}
        </div>
      </section>
    </main>
  );
}

function OrderCard({ order, currency, phone }: { order: Order; currency: string; phone: string }) {
  const message = [
    `Order ${order.id}`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `Address: ${order.delivery_address}`,
    order.notes ? `Notes: ${order.notes}` : "",
    "Items:",
    ...order.items.map((item) => `- ${item.quantity}x ${item.name_en} (${item.price} ${currency})`),
    `Total: ${order.total} ${currency}`,
  ]
    .filter(Boolean)
    .join("\n");
  const whatsapp = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <article className="panel p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-stone-500">{new Date(order.created_at).toLocaleString()}</p>
          <h2 className="mt-1 text-xl font-bold">{order.customer_name}</h2>
          <p className="text-sm text-stone-600">{order.customer_phone}</p>
          <p className="mt-2 text-sm text-stone-600">{order.delivery_address}</p>
          {order.notes ? <p className="mt-1 text-sm text-stone-500">{order.notes}</p> : null}
        </div>
        <form action={updateOrderStatus} className="flex gap-2">
          <input type="hidden" name="id" value={order.id} />
          <select className="field min-w-36" name="status" defaultValue={order.status}>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button className="btn-primary">Update</button>
        </form>
      </div>
      <div className="mt-4 divide-y divide-stone-100 rounded-lg border border-stone-200">
        {order.items.map((item) => (
          <div key={item.item_id} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <span>{item.quantity}x {item.name_en} / {item.name_ar}</span>
            <span className="font-semibold">{formatMoney(item.price * item.quantity, currency)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-bold">{formatMoney(order.total, currency)}</p>
        <a className="btn-secondary" href={whatsapp} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      </div>
    </article>
  );
}
