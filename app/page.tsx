import Link from "next/link";
import { getBrandCssVars } from "@/lib/brand";
import { activeRestaurantConfig } from "@/lib/mock-data";

export default function Home() {
  const brand = activeRestaurantConfig.branding;

  return (
    <main className="min-h-screen overflow-hidden bg-[#120806] text-[#fff7e8]" style={getBrandCssVars()}>
      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-5 py-12 text-center">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_24%,rgba(214,173,96,0.20),transparent_30%),radial-gradient(circle_at_18%_82%,rgba(111,29,43,0.26),transparent_34%),linear-gradient(135deg,#120806_0%,#24100c_52%,#150907_100%)]" />
        <div className="absolute left-1/2 top-1/2 -z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-[softGlow_7s_ease-in-out_infinite] rounded-full bg-[#6f1d2b]/25 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl animate-[slideUpFade_0.8s_ease-out] space-y-7">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d6ad60]">{brand.name} · {brand.city}</p>
          <div className="space-y-4">
            <h1 className="mx-auto font-serif text-4xl font-semibold leading-tight tracking-[0.05em] text-[#fff7e8] drop-shadow-[0_0_24px_rgba(244,216,164,0.16)] sm:text-6xl">
              {brand.tagline}
            </h1>
            <div className="mx-auto h-px w-28 bg-gradient-to-r from-transparent via-[#d6ad60] to-transparent" />
          </div>
          <p className="mx-auto max-w-xl text-base leading-8 text-[#e8d7bd]">
            {brand.description}
          </p>
          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <Link href="/menu" className="min-h-12 rounded-xl bg-gradient-to-r from-[#c99b4f] via-[#f4d8a4] to-[#c99b4f] px-6 py-3 text-sm font-black text-[#140b08] shadow-xl shadow-[#d6ad60]/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-[#d6ad60]/25 active:scale-[0.98]">
              Open {brand.shortName} menu
            </Link>
            <Link href="/admin/login" className="min-h-12 rounded-xl border border-[#d6ad60]/45 bg-[#21110d]/70 px-6 py-3 text-sm font-bold text-[#f4d8a4] shadow-xl shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-[#2a1511] active:scale-[0.98]">
              Admin login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
