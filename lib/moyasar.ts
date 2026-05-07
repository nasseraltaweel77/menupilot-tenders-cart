import { saveLocalOrder } from "@/lib/local-orders";
import type { OrderLineItem } from "@/types/database";

const moyasarApiBase = "https://api.moyasar.com/v1";

export type PendingPaymentOrder = {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  total: number;
  currency: string;
  items: OrderLineItem[];
};

export type MoyasarInvoice = {
  id: string;
  status: "initiated" | "paid" | "failed" | "refunded" | "canceled" | "on_hold" | "expired" | "voided";
  amount: number;
  currency: string;
  url?: string;
  metadata?: Record<string, string>;
};

export function getMoyasarSecretKey() {
  return process.env.MOYASAR_SECRET_KEY || "";
}

export async function createMoyasarInvoice(input: {
  order: PendingPaymentOrder;
  origin: string;
}) {
  const secretKey = getMoyasarSecretKey();
  if (!secretKey) {
    throw new Error("Moyasar is not configured.");
  }

  const response = await fetch(`${moyasarApiBase}/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(input.order.total * 100),
      currency: input.order.currency,
      description: `Roma Pastry order ${input.order.id}`,
      success_url: `${input.origin}/payment/thank-you?payment_id=${encodeURIComponent(input.order.id)}`,
      back_url: `${input.origin}/payment/thank-you?payment=failed`,
      callback_url: `${input.origin}/api/payments/moyasar/callback`,
      metadata: {
        payment_id: input.order.id,
        customer_name: input.order.customerName,
        customer_phone: input.order.customerPhone,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to create Moyasar payment session.");
  }

  return await response.json() as MoyasarInvoice;
}

export async function fetchMoyasarInvoice(invoiceId: string) {
  const secretKey = getMoyasarSecretKey();
  if (!secretKey) {
    throw new Error("Moyasar is not configured.");
  }

  const response = await fetch(`${moyasarApiBase}/invoices?id=${encodeURIComponent(invoiceId)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to verify Moyasar payment.");
  }

  const data = await response.json() as { invoices?: MoyasarInvoice[] };
  return data.invoices?.[0] || null;
}

export async function savePaidOrder(order: PendingPaymentOrder, invoiceId: string) {
  return saveLocalOrder({
    id: `PAID-${order.id}`,
    restaurantId: order.restaurantId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    notes: [order.notes, `Moyasar invoice: ${invoiceId}`].filter(Boolean).join(" | "),
    total: order.total,
    items: order.items,
    status: "Paid",
  });
}
