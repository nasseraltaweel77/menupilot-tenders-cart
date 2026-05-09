import { NextResponse } from "next/server";
import { getRestaurantConfigById } from "@/config/restaurants";
import { createPendingPayment, attachInvoiceToPendingPayment } from "@/lib/local-payments";
import { createMoyasarInvoice } from "@/lib/moyasar";
import type { OrderLineItem } from "@/types/database";

type PaymentRequest = {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  total: number;
  currency: string;
  items: OrderLineItem[];
};

export async function POST(request: Request) {
  try {
    const input = await request.json() as PaymentRequest;

    if (!input.items?.length || input.total <= 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const restaurantConfig = getRestaurantConfigById(input.restaurantId);
    if (!restaurantConfig.payments.enabled) {
      return NextResponse.json({ error: "Payments are not enabled for this restaurant." }, { status: 400 });
    }

    const pendingPayment = await createPendingPayment({
      restaurantId: input.restaurantId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      notes: input.notes,
      total: input.total,
      currency: input.currency || restaurantConfig.payments.currency,
      items: input.items,
    });

    const invoice = await createMoyasarInvoice({
      order: pendingPayment.order,
      origin: new URL(request.url).origin,
    });

    if (!invoice.url) {
      return NextResponse.json({ error: "Moyasar did not return a checkout URL." }, { status: 502 });
    }

    await attachInvoiceToPendingPayment(pendingPayment.id, invoice.id);
    return NextResponse.json({ url: invoice.url, invoiceId: invoice.id });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unable to create payment session.",
    }, { status: 500 });
  }
}
