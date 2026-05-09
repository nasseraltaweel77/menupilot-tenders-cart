import Link from "next/link";
import { WhatsAppAutoRedirect } from "@/components/payment/WhatsAppAutoRedirect";
import { finalizePendingPayment } from "@/lib/local-payments";
import { activeRestaurantConfig } from "@/lib/mock-data";

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string }>;
}) {
  const { payment_id: paymentId } = await searchParams;
  const result = paymentId ? await finalizePendingPayment(paymentId) : { status: "failed" as const, orderId: "" };
  const paid = result.status === "paid";
  const brand = activeRestaurantConfig.branding;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7ead5] px-4 py-10 text-[#351207]">
      <section className="w-full max-w-xl rounded-[2rem] border-2 border-[#f25a1d]/20 bg-[#fffaf1] p-6 text-center shadow-2xl shadow-[#c92216]/15 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#c92216]">{brand.name}</p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-[0.04em] text-[#351207]">
          {paid ? "Payment successful" : "Payment could not be confirmed"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#7a3c1e]">
          {paid
            ? "Your order has been saved as paid and will open in WhatsApp automatically."
            : "Please return to the menu and try again, or send the order through WhatsApp."}
        </p>

        <div className="mx-auto my-5 h-px max-w-48 bg-gradient-to-r from-transparent via-[#f25a1d]/45 to-transparent" />

        <h2 className="text-2xl font-black text-[#c92216]">
          {paid ? `Order ${result.orderId || "confirmed"}` : "Try again"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#7a3c1e]">
          {paid
            ? "Redirecting to WhatsApp in 2 seconds..."
            : "Your payment could not be confirmed. No paid order was saved."}
        </p>

        {paid && result.whatsappUrl ? (
          <>
            <WhatsAppAutoRedirect whatsappUrl={result.whatsappUrl} />
            <div className="mt-5 rounded-2xl border border-[#f25a1d]/20 bg-[#fff2df] p-4 text-start">
              <p className="text-sm font-black text-[#c92216]">WhatsApp message ready</p>
              <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-xs leading-6 text-[#351207]">
                {result.whatsappMessage}
              </pre>
            </div>
          </>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            className="rounded-2xl bg-gradient-to-r from-[#c92216] via-[#f25a1d] to-[#ffb000] px-5 py-3 text-sm font-black uppercase text-white shadow-xl shadow-[#f25a1d]/25 transition hover:-translate-y-0.5"
            href="/menu"
          >
            Back to menu
          </Link>
          <Link
            className="rounded-2xl border border-[#f25a1d]/40 bg-white px-5 py-3 text-sm font-black uppercase text-[#c92216] transition hover:-translate-y-0.5 hover:bg-[#fff2df]"
            href="/"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
