import Link from "next/link";
import { finalizePendingPayment } from "@/lib/local-payments";

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string }>;
}) {
  const { payment_id: paymentId } = await searchParams;
  const result = paymentId ? await finalizePendingPayment(paymentId) : { status: "failed" as const, orderId: "" };
  const paid = result.status === "paid";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#120806] px-4 py-10 text-[#fff7e8]">
      <section className="w-full max-w-xl rounded-2xl border border-[#d6ad60]/30 bg-[linear-gradient(180deg,#24120e,#170a08)] p-6 text-center shadow-2xl shadow-black/35 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d6ad60]">Roma Pastry</p>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-[0.06em] text-[#fff7e8]">
          {paid ? "تم الدفع بنجاح" : "تعذر تأكيد الدفع"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#cdbd9f]">
          {paid
            ? "شكراً لك. تم حفظ طلبك كطلب مدفوع وسيظهر في لوحة التحكم والتقارير."
            : "لم نتمكن من تأكيد عملية الدفع. يمكنك العودة للسلة والمحاولة مرة أخرى."}
        </p>
        <div className="mx-auto my-5 h-px max-w-48 bg-gradient-to-r from-transparent via-[#d6ad60]/45 to-transparent" />
        <h2 className="font-serif text-2xl font-semibold text-[#f4d8a4]">
          {paid ? "Payment successful" : "Payment could not be confirmed"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#cdbd9f]">
          {paid
            ? `Your paid order${result.orderId ? ` (${result.orderId})` : ""} has been saved.`
            : "Please return to the menu and try again, or send the order through WhatsApp."}
        </p>
        {paid && result.whatsappUrl ? (
          <div className="mt-5 rounded-xl border border-[#d6ad60]/20 bg-[#140b08]/70 p-4 text-start">
            <p className="text-sm font-bold text-[#f4d8a4]">WhatsApp message ready</p>
            <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#0f0705] p-3 text-xs leading-6 text-[#cdbd9f]">
              {result.whatsappMessage}
            </pre>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {paid && result.whatsappUrl ? (
            <a className="rounded-xl border border-[#d6ad60]/45 bg-[#21110d]/70 px-5 py-3 text-sm font-bold text-[#f4d8a4] transition hover:-translate-y-0.5 hover:bg-[#2a1511]" href={result.whatsappUrl} target="_blank" rel="noreferrer">
              Send WhatsApp
            </a>
          ) : null}
          <Link className="rounded-xl bg-gradient-to-r from-[#c99b4f] via-[#f4d8a4] to-[#c99b4f] px-5 py-3 text-sm font-black text-[#140b08] shadow-xl shadow-[#d6ad60]/15 transition hover:-translate-y-0.5" href="/menu">
            Back to menu
          </Link>
          <Link className="rounded-xl border border-[#d6ad60]/45 bg-[#21110d]/70 px-5 py-3 text-sm font-bold text-[#f4d8a4] transition hover:-translate-y-0.5 hover:bg-[#2a1511]" href="/">
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
