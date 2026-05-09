import { NextResponse } from "next/server";
import { getSavedOrders } from "@/lib/local-orders";
import { activeRestaurantConfig } from "@/lib/mock-data";
import type { Order } from "@/types/database";

type ExportRange = "all" | "today" | "month";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = parseRange(url.searchParams.get("range"));
  const orders = filterOrders(await getSavedOrders(), range);
  const csv = toCsv(orders);

  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename=\"${activeRestaurantConfig.data.storagePrefix}-orders-${range}.csv\"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

function parseRange(value: string | null): ExportRange {
  if (value === "today" || value === "month") return value;
  return "all";
}

function filterOrders(orders: Order[], range: ExportRange) {
  if (range === "today") {
    return orders.filter((order) => isToday(order.created_at));
  }

  if (range === "month") {
    return orders.filter((order) => isCurrentMonth(order.created_at));
  }

  return orders;
}

function toCsv(orders: Order[]) {
  const header = [
    "Order number",
    "Date",
    "Customer name",
    "Phone",
    "Products",
    "Total",
    "Status",
    "Location link",
  ];

  const rows = orders.map((order) => [
    order.id,
    new Date(order.created_at).toISOString(),
    order.customer_name,
    order.customer_phone,
    order.items.map((item) => `${item.quantity}x ${item.name_en} / ${item.name_ar}`).join(" | "),
    String(order.total),
    order.status,
    extractLocationLink(order.notes),
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function isToday(date: string) {
  return new Date(date).toDateString() === new Date().toDateString();
}

function isCurrentMonth(date: string) {
  const value = new Date(date);
  const now = new Date();
  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();
}

function extractLocationLink(notes: string | null) {
  return notes?.match(/https:\/\/maps\.google\.com\/\?q=[^\s|]+/)?.[0] || "";
}
