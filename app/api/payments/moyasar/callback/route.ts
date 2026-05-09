import { NextResponse } from "next/server";
import { markMoyasarInvoicePaid } from "@/lib/local-payments";

type MoyasarCallback = {
  id?: string;
  status?: string;
  metadata?: {
    payment_id?: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as MoyasarCallback;

    if (body.id && body.status === "paid") {
      await markMoyasarInvoicePaid(body.id, body.metadata?.payment_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to process Moyasar callback.",
    }, { status: 200 });
  }
}
