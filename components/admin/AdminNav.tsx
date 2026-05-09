import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { activeRestaurantConfig } from "@/lib/mock-data";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/items", label: "Items" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/accounting", label: "Accounting" },
];

export function AdminNav({ restaurantSlug }: { restaurantSlug?: string }) {
  const brand = activeRestaurantConfig.branding;

  return (
    <header className="border-b border-[#d6ad60]/20 bg-[#1c100c] text-[#fff7e8]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/dashboard" className="text-lg font-bold text-[#fff7e8]">
            {brand.name}
          </Link>
          {restaurantSlug ? (
            <Link href="/menu" className="ml-3 text-sm font-semibold text-[#d6ad60]">
              Public menu
            </Link>
          ) : null}
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#e8d7bd] hover:bg-[#2a1511] hover:text-[#f4d8a4]">
              {link.label}
            </Link>
          ))}
          <form action={signOut}>
            <button className="rounded-lg px-3 py-2 text-sm font-semibold text-[#f4d8a4] hover:bg-[#2a1511]">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
