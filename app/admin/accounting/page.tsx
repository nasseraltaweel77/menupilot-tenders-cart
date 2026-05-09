import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/admin/actions";
import { formatMoney } from "@/lib/i18n";
import { getSavedOrders } from "@/lib/local-orders";
import { activeRestaurantConfig } from "@/lib/mock-data";
import type { Order, OrderLineItem } from "@/types/database";

type BestSeller = OrderLineItem;

export const dynamic = "force-dynamic";

export default async function AccountingDashboardPage() {
  const orders = await getSavedOrders();
  const todayOrders = orders.filter((order) => isToday(order.created_at));
  const monthOrders = orders.filter((order) => isCurrentMonth(order.created_at));
  const todaySales = sumOrders(todayOrders);
  const monthSales = sumOrders(monthOrders);
  const averageOrderValue = orders.length ? sumOrders(orders) / orders.length : 0;
  const bestSellers = getBestSellers(orders);
  const brand = activeRestaurantConfig.branding;

  return (
    <main className="min-h-screen bg-[#140b08] text-[#fff7e8]">
      <header className="border-b border-[#d6ad60]/20 bg-[#1c100c] text-[#fff7e8]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d6ad60]">{brand.name} · Accounting</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[0.04em]">Sales dashboard</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-[#e8d7bd] hover:bg-[#2a1511] hover:text-[#f4d8a4]" href="/admin/accounting">
              Accounting
            </Link>
            <form action={signOut}>
              <button className="rounded-lg px-3 py-2 text-sm font-semibold text-[#f4d8a4] hover:bg-[#2a1511]">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#d6ad60]">{brand.city}</p>
            <h2 className="text-3xl font-bold text-[#fff7e8]">Tenders Cart Sales Reports</h2>
            <p className="mt-2 text-sm text-[#cdbd9f]">Read-only order and sales reporting.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton href="/admin/accounting/export?range=all" label="Export all orders" />
            <ExportButton href="/admin/accounting/export?range=today" label="Export today" />
            <ExportButton href="/admin/accounting/export?range=month" label="Export month" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Today sales" value={formatMoney(todaySales, "SAR")} />
          <Stat label="This month sales" value={formatMoney(monthSales, "SAR")} />
          <Stat label="Number of orders" value={orders.length} />
          <Stat label="Average order value" value={formatMoney(averageOrderValue, "SAR")} />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-lg border border-[#d6ad60]/25 bg-[#21110d] p-5">
            <h2 className="text-xl font-bold text-[#f4d8a4]">Best selling products</h2>
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
                <AccountingEmptyState />
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-[#d6ad60]/25 bg-[#21110d]">
            <div className="border-b border-[#d6ad60]/20 px-5 py-4">
              <h2 className="text-xl font-bold text-[#f4d8a4]">Orders table</h2>
            </div>
            {orders.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="bg-[#140b08] text-xs uppercase tracking-[0.12em] text-[#d6ad60]">
                    <tr>
                      <Th>Order number</Th>
                      <Th>Date</Th>
                      <Th>Customer name</Th>
                      <Th>Phone</Th>
                      <Th>Products</Th>
                      <Th>Total</Th>
                      <Th>Status</Th>
                      <Th>Location link</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d6ad60]/15">
                    {orders.map((order) => (
                      <tr key={order.id} className="align-top hover:bg-[#2a1511]">
                        <Td>{order.id}</Td>
                        <Td>{formatDate(order.created_at)}</Td>
                        <Td>{order.customer_name}</Td>
                        <Td>{order.customer_phone}</Td>
                        <Td>{order.items.map((item) => `${item.quantity}x ${item.name_ar}`).join(", ")}</Td>
                        <Td>{formatMoney(order.total, "SAR")}</Td>
                        <Td>{order.status}</Td>
                        <Td>
                          {extractLocationLink(order.notes) ? (
                            <a className="font-semibold text-[#d6ad60] underline-offset-4 hover:underline" href={extractLocationLink(order.notes)} target="_blank" rel="noreferrer">
                              Open
                            </a>
                          ) : (
                            <span className="text-[#cdbd9f]">-</span>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5">
                <AccountingEmptyState />
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function ExportButton({ href, label }: { href: string; label: string }) {
  return (
    <a className="rounded-lg border border-[#d6ad60]/45 bg-[#21110d]/70 px-3 py-2 text-sm font-bold text-[#f4d8a4] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#2a1511]" href={href}>
      {label}
    </a>
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

function AccountingEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[#d6ad60]/25 bg-[#140b08]/60 px-4 py-6 text-center">
      <p className="font-bold text-[#f4d8a4]">No orders yet</p>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-bold">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 text-[#fff7e8]">{children}</td>;
}

function sumOrders(orders: Order[]) {
  return orders.reduce((sum, order) => sum + order.total, 0);
}

function getBestSellers(orders: Order[]): BestSeller[] {
  const sellers = new Map<string, BestSeller>();

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

function isCurrentMonth(date: string) {
  const value = new Date(date);
  const now = new Date();
  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-SA");
}

function extractLocationLink(notes: string | null) {
  return notes?.match(/https:\/\/maps\.google\.com\/\?q=[^\s|]+/)?.[0] || "";
}
