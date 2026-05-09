import { notFound, redirect } from "next/navigation";
import { MenuView } from "@/components/menu/MenuView";
import { getRestaurantConfig } from "@/config/restaurants";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;

  if (slug === "demo") {
    redirect(lang === "en" ? "/menu?lang=en" : "/menu");
  }

  const restaurantConfig = getRestaurantConfig(slug);
  const isTendersRoute =
    restaurantConfig.aliases.includes(slug) ||
    slug === restaurantConfig.restaurant.slug ||
    slug === restaurantConfig.restaurant.id;

  if (!isTendersRoute) {
    notFound();
  }

  return (
    <MenuView
      restaurant={restaurantConfig.restaurant}
      categories={restaurantConfig.categories}
      items={restaurantConfig.menuItems}
      initialLocale={(lang === "en" ? "en" : "ar") as Locale}
      brandConfig={restaurantConfig}
    />
  );
}
