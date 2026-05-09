import { MenuView } from "@/components/menu/MenuView";
import { getMockItemsWithImages } from "@/lib/local-images";
import { activeRestaurantConfig, mockCategories, mockRestaurant } from "@/lib/mock-data";
import type { Locale } from "@/lib/i18n";

export default async function OfficialMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const items = await getMockItemsWithImages(activeRestaurantConfig);

  return (
    <MenuView
      restaurant={mockRestaurant}
      categories={mockCategories}
      items={items}
      initialLocale={(lang === "en" ? "en" : "ar") as Locale}
      brandConfig={activeRestaurantConfig}
    />
  );
}
