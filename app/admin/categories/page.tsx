import { AdminNav } from "@/components/admin/AdminNav";
import { EmptyState } from "@/components/admin/EmptyState";
import { deleteCategory, upsertCategory } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv, mockCategories, mockRestaurant } from "@/lib/mock-data";
import type { MenuCategory } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  if (!hasSupabaseEnv()) {
    return <CategoriesView restaurant={mockRestaurant} categories={mockCategories} />;
  }

  const { supabase, user } = await requireUser();
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).single();
  const { data: categories } = restaurant
    ? await supabase.from("menu_categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order")
    : { data: [] };

  return <CategoriesView restaurant={restaurant} categories={(categories || []) as MenuCategory[]} />;
}

function CategoriesView({
  restaurant,
  categories,
}: {
  restaurant?: { slug: string };
  categories: MenuCategory[];
}) {
  return (
    <main className="min-h-screen bg-paper">
      <AdminNav restaurantSlug={restaurant?.slug} />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[380px_1fr]">
        <div className="panel p-5">
          <h1 className="text-xl font-bold">Add category</h1>
          <CategoryForm />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Categories</h2>
          {categories.length ? (
            categories.map((category) => (
              <div key={category.id} className="panel p-5">
                <CategoryForm category={category} />
              </div>
            ))
          ) : (
            <EmptyState title="No categories yet" body="Add sections like Mains, Drinks, Desserts, or Arabic names for your menu." />
          )}
        </div>
      </section>
    </main>
  );
}

function CategoryForm({ category }: { category?: MenuCategory }) {
  return (
    <form action={upsertCategory} className="mt-4 grid gap-3">
      <input type="hidden" name="id" value={category?.id || ""} />
      <label className="text-sm font-semibold">
        English name
        <input className="field mt-1" name="name_en" defaultValue={category?.name_en} required />
      </label>
      <label className="text-sm font-semibold">
        Arabic name
        <input className="field mt-1" name="name_ar" dir="rtl" defaultValue={category?.name_ar} required />
      </label>
      <label className="text-sm font-semibold">
        Sort order
        <input className="field mt-1" type="number" name="sort_order" defaultValue={category?.sort_order || 0} />
      </label>
      <div className="flex gap-2">
        <button className="btn-primary" type="submit">{category ? "Save" : "Add category"}</button>
        {category ? (
          <button formAction={deleteCategory} className="btn-secondary text-clay" type="submit">
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
