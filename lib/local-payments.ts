import { promises as fs } from "fs";
import path from "path";
import { fetchMoyasarInvoice, savePaidOrder, type PendingPaymentOrder } from "@/lib/moyasar";
import { getProductionStorageClient, hasProductionStorage, isVercelRuntime } from "@/lib/production-storage";

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
  const paymentId = `PAY-${Date.now()}`;
  const payment: PendingPayment = {
    id: paymentId,
    status: "initiated",
    order: {
      ...order,
      id: paymentId,
    },
    created_at: new Date().toISOString(),
  };

  await savePendingPayment(payment);
  return payment;
}

export async function attachInvoiceToPendingPayment(paymentId: string, invoiceId: string) {
  const payment = await getPendingPayment(paymentId);
  if (!payment) return;

  payment.invoiceId = invoiceId;
  await savePendingPayment(payment);
}

export async function markMoyasarInvoicePaid(invoiceId: string, paymentId?: string) {
  const payment = paymentId ? await getPendingPayment(paymentId) : await getPendingPaymentByInvoice(invoiceId);
  if (!payment) return null;

  payment.status = "paid";
  payment.invoiceId = invoiceId;
  const orderId = await savePaidOrder(payment.order, invoiceId);
  await savePendingPayment(payment);
  return orderId;
}

export async function finalizePendingPayment(paymentId: string) {
  const payment = await getPendingPayment(paymentId);
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

async function savePendingPayment(payment: PendingPayment) {
  if (isVercelRuntime()) {
    await saveProductionPendingPayment(payment);
    return;
  }

  const payments = await readLocalPendingPayments();
  payments[payment.id] = payment;
  await writeLocalPendingPayments(payments);
}

async function getPendingPayment(paymentId: string) {
  if (isVercelRuntime()) {
    return getProductionPendingPayment(paymentId);
  }

  const payments = await readLocalPendingPayments();
  return payments[paymentId] || null;
}

async function getPendingPaymentByInvoice(invoiceId: string) {
  if (isVercelRuntime()) {
    return getProductionPendingPaymentByInvoice(invoiceId);
  }

  const payments = await readLocalPendingPayments();
  return Object.values(payments).find((entry) => entry.invoiceId === invoiceId) || null;
}

async function saveProductionPendingPayment(payment: PendingPayment) {
  const supabase = getProductionStorageClient();
  const { error } = await supabase
    .from("roma_pending_payments")
    .upsert({
      id: payment.id,
      invoice_id: payment.invoiceId || null,
      status: payment.status,
      payment_data: payment,
      created_at: payment.created_at,
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function getProductionPendingPayment(paymentId: string): Promise<PendingPayment | null> {
  if (!hasProductionStorage()) return null;

  const supabase = getProductionStorageClient();
  const { data, error } = await supabase
    .from("roma_pending_payments")
    .select("payment_data")
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.payment_data as PendingPayment || null;
}

async function getProductionPendingPaymentByInvoice(invoiceId: string): Promise<PendingPayment | null> {
  if (!hasProductionStorage()) return null;

  const supabase = getProductionStorageClient();
  const { data, error } = await supabase
    .from("roma_pending_payments")
    .select("payment_data")
    .eq("invoice_id", invoiceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.payment_data as PendingPayment || null;
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

async function readLocalPendingPayments(): Promise<Record<string, PendingPayment>> {
  try {
    const raw = await fs.readFile(pendingPaymentsPath, "utf8");
    return JSON.parse(raw) as Record<string, PendingPayment>;
  } catch {
    return {};
  }
}

async function writeLocalPendingPayments(payments: Record<string, PendingPayment>) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(pendingPaymentsPath, JSON.stringify(payments, null, 2), "utf8");
}
