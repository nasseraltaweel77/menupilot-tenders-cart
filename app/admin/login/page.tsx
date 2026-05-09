import { signIn } from "@/app/admin/actions";
import { activeRestaurantConfig } from "@/lib/mock-data";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const brand = activeRestaurantConfig.branding;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <section className="panel w-full max-w-md p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{brand.name}</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">Admin login</h1>
          <p className="mt-2 text-sm text-stone-500">Sign in to manage the {brand.name} menu and orders.</p>
        </div>
        {params.error ? (
          <p className="mb-4 rounded-lg bg-clay/10 px-3 py-2 text-sm font-semibold text-clay">
            {params.error}
          </p>
        ) : null}
        <form action={signIn} className="space-y-4">
          <label className="block text-sm font-semibold text-stone-700">
            Username
            <input className="field mt-1" name="username" autoComplete="username" required />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Password
            <input className="field mt-1" type="password" name="password" autoComplete="current-password" required />
          </label>
          <button className="btn-primary w-full" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
