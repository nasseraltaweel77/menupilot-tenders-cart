import Link from "next/link";
import { getBrandCssVars } from "@/lib/brand";
import { activeRestaurantConfig } from "@/lib/mock-data";

export default function Home() {
  const brand = activeRestaurantConfig.branding;
  const instagram = activeRestaurantConfig.contact.socialLinks.instagram;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7ead5] text-[#351207]" style={getBrandCssVars()}>
      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-5 py-12 text-center">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,176,0,0.32),transparent_30%),radial-gradient(circle_at_18%_82%,rgba(242,90,29,0.24),transparent_34%),linear-gradient(135deg,#f7ead5_0%,#fff6e8_52%,#f4d3a5_100%)]" />
        <div className="absolute left-1/2 top-1/2 -z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-[softGlow_7s_ease-in-out_infinite] rounded-full bg-[#f25a1d]/25 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl animate-[slideUpFade_0.8s_ease-out] space-y-7">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#c92216]">
            {brand.name}{instagram ? ` · @${instagram}` : ""}
          </p>
          <div className="space-y-4">
            <h1 className="mx-auto text-5xl font-black uppercase leading-tight tracking-[0.03em] text-[#c92216] drop-shadow-[0_8px_0_rgba(255,176,0,0.35)] sm:text-7xl">
              {brand.tagline}
            </h1>
            <div className="mx-auto h-1 w-32 rounded-full bg-gradient-to-r from-[#c92216] via-[#f25a1d] to-[#ffb000]" />
          </div>
          <p className="mx-auto max-w-xl text-base font-semibold leading-8 text-[#6a2a13]">
            {brand.description}
          </p>
          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <Link href="/menu" className="min-h-12 rounded-xl bg-gradient-to-r from-[#c92216] via-[#f25a1d] to-[#ffb000] px-6 py-3 text-sm font-black uppercase text-white shadow-xl shadow-[#f25a1d]/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-[#f25a1d]/35 active:scale-[0.98]">
              Open {brand.shortName} menu
            </Link>
            <Link href="/admin/login" className="min-h-12 rounded-xl border-2 border-[#c92216] bg-[#fff6e8]/80 px-6 py-3 text-sm font-black uppercase text-[#c92216] shadow-xl shadow-[#c92216]/10 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]">
              Admin login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
