import { MenuView } from "@/components/menu/MenuView";
import { activeRestaurantConfig, mockCategories, mockRestaurant } from "@/lib/mock-data";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function OfficialMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;

  return (
    <MenuView
      restaurant={mockRestaurant}
      categories={mockCategories}
      items={activeRestaurantConfig.menuItems}
      initialLocale={(lang === "en" ? "en" : "ar") as Locale}
      brandConfig={activeRestaurantConfig}
    />
  );
}
