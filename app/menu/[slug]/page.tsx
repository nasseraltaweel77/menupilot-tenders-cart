import { notFound, redirect } from "next/navigation";
import { MenuView } from "@/components/menu/MenuView";
import { getRestaurantConfig } from "@/config/restaurants";
import { getMockItemsWithImages } from "@/lib/local-images";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/mock-data";
import type { Locale } from "@/lib/i18n";

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

  if (!hasSupabaseEnv()) {
    if (!restaurantConfig.aliases.includes(slug) && slug !== restaurantConfig.restaurant.slug && slug !== restaurantConfig.restaurant.id) {
      notFound();
    }
    const items = await getMockItemsWithImages(restaurantConfig);

    return (
      <MenuView
        restaurant={restaurantConfig.restaurant}
        categories={restaurantConfig.categories}
        items={items}
        initialLocale={(lang === "en" ? "en" : "ar") as Locale}
        brandConfig={restaurantConfig}
      />
    );
  }

  const supabase = await createClient();
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("slug", slug).single();

  if (!restaurant) {
    notFound();
  }

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
    supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <MenuView
      restaurant={restaurant}
      categories={categories || []}
      items={items || []}
      initialLocale={(lang === "en" ? "en" : "ar") as Locale}
      brandConfig={restaurantConfig}
    />
  );
}
