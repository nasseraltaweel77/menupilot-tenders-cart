import { promises as fs } from "fs";
import path from "path";
import { getProductionStorageClient, hasProductionStorage, isVercelRuntime } from "@/lib/production-storage";
import type { Order, OrderLineItem, OrderStatus } from "@/types/database";

const dataDir = path.join(process.cwd(), "data");
const ordersPath = path.join(dataDir, "orders.json");

export async function getSavedOrders(): Promise<Order[]> {
  const orders = isVercelRuntime() ? await readProductionOrders() : await readLocalOrders();
  return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function saveLocalOrder(input: {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  total: number;
  items: OrderLineItem[];
  status?: OrderStatus;
  id?: string;
}) {
  const order: Order = {
    id: input.id || `ROMA-${Date.now()}`,
    restaurant_id: input.restaurantId,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    delivery_address: input.deliveryAddress,
    notes: input.notes || null,
    status: input.status || "New",
    total: input.total,
    items: input.items,
    created_at: new Date().toISOString(),
  };

  if (isVercelRuntime()) {
    await saveProductionOrder(order);
    return order.id;
  }

  await saveDevelopmentOrder(order);
  return order.id;
}

async function readProductionOrders(): Promise<Order[]> {
  if (!hasProductionStorage()) {
    return [];
  }

  const supabase = getProductionStorageClient();
  const { data, error } = await supabase
    .from("roma_orders")
    .select("order_data")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) => row.order_data as Order);
}

async function saveProductionOrder(order: Order) {
  const supabase = getProductionStorageClient();
  const { error } = await supabase
    .from("roma_orders")
    .upsert({
      id: order.id,
      order_data: order,
      created_at: order.created_at,
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function saveDevelopmentOrder(order: Order) {
  await fs.mkdir(dataDir, { recursive: true });
  const orders = await readLocalOrders();

  if (orders.some((savedOrder) => savedOrder.id === order.id)) {
    return;
  }

  orders.unshift(order);
  await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), "utf8");
}

async function readLocalOrders(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(ordersPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as Order[] : [];
  } catch {
    return [];
  }
}
