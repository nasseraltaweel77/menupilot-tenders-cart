import { AdminNav } from "@/components/admin/AdminNav";
import { DeleteItemButton } from "@/components/admin/DeleteItemButton";
import { EmptyState } from "@/components/admin/EmptyState";
import { ItemImageForm } from "@/components/admin/ItemImageForm";
import { upsertItem } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { getMockItemsWithImages } from "@/lib/local-images";
import { hasSupabaseEnv, mockCategories, mockRestaurant } from "@/lib/mock-data";
import type { MenuCategory, MenuItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  if (!hasSupabaseEnv()) {
    const items = await getMockItemsWithImages();
    return <ItemsView restaurant={mockRestaurant} categories={mockCategories} items={items} success={success} error={error} />;
  }

  const { supabase, user } = await requireUser();
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).single();
  const [{ data: categories }, { data: items }] = restaurant
    ? await Promise.all([
        supabase.from("menu_categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
        supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <ItemsView
      restaurant={restaurant}
      categories={(categories || []) as MenuCategory[]}
      items={(items || []) as MenuItem[]}
      success={success}
      error={error}
    />
  );
}

function ItemsView({
  restaurant,
  categories,
  items,
  success,
  error,
}: {
  restaurant?: { slug: string };
  categories: MenuCategory[];
  items: MenuItem[];
  success?: string;
  error?: string;
}) {
  return (
    <main className="min-h-screen bg-paper">
      <AdminNav restaurantSlug={restaurant?.slug} />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 xl:grid-cols-[420px_1fr]">
        <div className="panel p-5">
          <h1 className="text-xl font-bold">Add menu item</h1>
          {success ? (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {success}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
              {error}
            </p>
          ) : null}
          <ItemForm categories={categories} />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Menu items</h2>
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className="panel p-5">
                <ItemForm item={item} categories={categories} />
              </div>
            ))
          ) : (
            <EmptyState title="No menu items yet" body="Create dishes with bilingual names, prices, images, and availability." />
          )}
        </div>
      </section>
    </main>
  );
}

function ItemForm({ item, categories }: { item?: MenuItem; categories: MenuCategory[] }) {
  return (
    <>
      <form action={upsertItem} className="mt-4 grid gap-3">
        <input type="hidden" name="id" value={item?.id || ""} />
        <input type="hidden" name="current_image_url" value={item?.image_url || ""} />
        <label className="text-sm font-semibold">
          Category
          <select className="field mt-1" name="category_id" defaultValue={item?.category_id || ""}>
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_en} / {category.name_ar}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          English name
          <input className="field mt-1" name="name_en" defaultValue={item?.name_en} required />
        </label>
        <label className="text-sm font-semibold">
          Arabic name
          <input className="field mt-1" name="name_ar" dir="rtl" defaultValue={item?.name_ar} required />
        </label>
      </div>
      <label className="text-sm font-semibold">
        English description
        <textarea className="field mt-1 min-h-20" name="description_en" defaultValue={item?.description_en || ""} />
      </label>
      <label className="text-sm font-semibold">
        Arabic description
        <textarea className="field mt-1 min-h-20" name="description_ar" dir="rtl" defaultValue={item?.description_ar || ""} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Price
          <input className="field mt-1" type="number" step="0.01" min="0" name="price" defaultValue={item?.price || 0} required />
        </label>
        <label className="text-sm font-semibold">
          Image URL
          <input className="field mt-1" type="text" name="image_url" defaultValue={item?.image_url || ""} placeholder="https://... or /uploads/image.jpg" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input className="h-4 w-4 accent-leaf" type="checkbox" name="is_available" defaultChecked={item?.is_available ?? true} />
        Available
      </label>
      <div className="flex gap-2">
        <button className="btn-primary" type="submit">{item ? "Save" : "Add item"}</button>
        {item ? (
          <DeleteItemButton />
        ) : null}
      </div>
      </form>
      {item ? <ItemImageForm itemId={item.id} currentImageUrl={item.image_url} /> : null}
    </>
  );
}
