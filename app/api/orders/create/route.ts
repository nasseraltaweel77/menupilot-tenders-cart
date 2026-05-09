import { NextResponse } from "next/server";
import { getRestaurantConfigById } from "@/config/restaurants";
import { saveLocalOrder } from "@/lib/local-orders";
import type { OrderLineItem } from "@/types/database";

type CreateOrderRequest = {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  total: number;
  items: OrderLineItem[];
};

export async function POST(request: Request) {
  try {
    const input = await request.json() as CreateOrderRequest;
    const restaurantConfig = getRestaurantConfigById(input.restaurantId);

    if (!input.items?.length || input.total <= 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (!input.customerName || !input.customerPhone || !input.deliveryAddress) {
      return NextResponse.json({ error: "Please complete the checkout details." }, { status: 400 });
    }

    const id = await saveLocalOrder({
      restaurantId: restaurantConfig.restaurant.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      notes: input.notes,
      total: input.total,
      items: input.items,
    });

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({
      error: getFriendlyOrderError(error),
    }, { status: 500 });
  }
}

function getFriendlyOrderError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("tenders_orders") || lowerMessage.includes("could not find the table") || lowerMessage.includes("does not exist")) {
    return "Order storage is not ready yet. WhatsApp can still send your order.";
  }

  if (message.includes("Production storage is not configured")) {
    return "Order storage is not configured yet. WhatsApp can still send your order.";
  }

  return message || "Unable to save order. WhatsApp can still send your order.";
}
