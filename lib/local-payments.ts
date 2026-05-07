import { promises as fs } from "fs";
import path from "path";
import { fetchMoyasarInvoice, savePaidOrder, type PendingPaymentOrder } from "@/lib/moyasar";

const dataDir = path.join(process.cwd(), "data");
const pendingPaymentsPath = path.join(dataDir, "pending-payments.json");

type PendingPayment = {
  id: string;
  invoiceId?: string;
  status: "initiated" | "paid" | "failed";
  order: PendingPaymentOrder;
  created_at: string;
};

export type FinalizedPayment = {
  status: "paid" | "failed";
  orderId: string;
  whatsappUrl: string;
  whatsappMessage: string;
};

export async function createPendingPayment(order: Omit<PendingPaymentOrder, "id">) {
  await fs.mkdir(dataDir, { recursive: true });
  const payments = await readPendingPayments();
  const payment: PendingPayment = {
    id: `PAY-${Date.now()}`,
    status: "initiated",
    order: {
      ...order,
      id: `PAY-${Date.now()}`,
    },
    created_at: new Date().toISOString(),
  };

  payment.order.id = payment.id;
  payments[payment.id] = payment;
  await writePendingPayments(payments);
  return payment;
}

export async function attachInvoiceToPendingPayment(paymentId: string, invoiceId: string) {
  const payments = await readPendingPayments();
  if (!payments[paymentId]) return;
  payments[paymentId].invoiceId = invoiceId;
  await writePendingPayments(payments);
}

export async function markMoyasarInvoicePaid(invoiceId: string, paymentId?: string) {
  const payments = await readPendingPayments();
  const payment = paymentId ? payments[paymentId] : Object.values(payments).find((entry) => entry.invoiceId === invoiceId);
  if (!payment) return null;

  payment.status = "paid";
  payment.invoiceId = invoiceId;
  const orderId = await savePaidOrder(payment.order, invoiceId);
  payments[payment.id] = payment;
  await writePendingPayments(payments);
  return orderId;
}

export async function finalizePendingPayment(paymentId: string) {
  const payments = await readPendingPayments();
  const payment = payments[paymentId];
  if (!payment?.invoiceId) {
    return emptyFinalizedPayment("failed");
  }

  const invoice = await fetchMoyasarInvoice(payment.invoiceId);
  if (invoice?.status !== "paid") {
    return emptyFinalizedPayment("failed");
  }

  const orderId = await markMoyasarInvoicePaid(payment.invoiceId, paymentId);
  const whatsappMessage = buildPaidOrderWhatsappMessage(payment.order, orderId || "");
  return {
    status: "paid" as const,
    orderId: orderId || "",
    whatsappMessage,
    whatsappUrl: `https://wa.me/966545199610?text=${encodeURIComponent(whatsappMessage)}`,
  };
}

function emptyFinalizedPayment(status: "failed"): FinalizedPayment {
  return {
    status,
    orderId: "",
    whatsappMessage: "",
    whatsappUrl: "",
  };
}

function buildPaidOrderWhatsappMessage(order: PendingPaymentOrder, orderId: string) {
  return [
    "Roma Pastry Paid Order",
    orderId ? `Order: ${orderId}` : "",
    "",
    "Products:",
    ...order.items.map((item) => `${item.quantity} x ${item.name_ar} / ${item.name_en} - ${item.price * item.quantity} ${order.currency}`),
    "",
    `Total: ${order.total} ${order.currency}`,
    "Status: Paid",
    "",
    `Customer: ${order.customerName || "-"}`,
    `Phone: ${order.customerPhone || "-"}`,
    `Address: ${order.deliveryAddress || "-"}`,
    `Details: ${order.notes || "-"}`,
  ].join("\n");
}

async function readPendingPayments(): Promise<Record<string, PendingPayment>> {
  try {
    const raw = await fs.readFile(pendingPaymentsPath, "utf8");
    return JSON.parse(raw) as Record<string, PendingPayment>;
  } catch {
    return {};
  }
}

async function writePendingPayments(payments: Record<string, PendingPayment>) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(pendingPaymentsPath, JSON.stringify(payments, null, 2), "utf8");
}
