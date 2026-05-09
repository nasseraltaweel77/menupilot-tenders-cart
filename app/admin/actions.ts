"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { defaultRouteForRole } from "@/lib/admin-roles";
import { clearAdminSessionCookie, getCredentialsForRole, setAdminSessionCookie } from "@/lib/admin-session";
import { hasSupabaseEnv } from "@/lib/mock-data";
import { deleteLocalItem, saveLocalItem, saveLocalItemImage } from "@/lib/local-images";
import { saveLocalOrder } from "@/lib/local-orders";
import type { OrderLineItem, OrderStatus } from "@/types/database";

async function currentRestaurantId() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Create a restaurant record in Supabase before managing menus.");
  }

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return { supabase, restaurantId: data.id };
}

export async function signIn(formData: FormData) {
  const submittedUsername = String(formData.get("username") || "");
  const submittedPassword = String(formData.get("password") || "");

  for (const role of ["admin", "accountant"] as const) {
    const { username, password } = getCredentialsForRole(role);
    if (submittedUsername === username && submittedPassword === password) {
      await setAdminSessionCookie(role);
      redirect(defaultRouteForRole(role));
    }
  }

  if (!hasSupabaseEnv()) {
    redirect("/admin/login?error=Invalid%20username%20or%20password");
  }

  const email = String(formData.get("email") || "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password: submittedPassword });
  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/dashboard");
}

export async function signOut() {
  await clearAdminSessionCookie();

  if (!hasSupabaseEnv()) {
    redirect("/admin/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function upsertCategory(formData: FormData) {
  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/categories");
    return;
  }

  const { supabase, restaurantId } = await currentRestaurantId();
  const id = String(formData.get("id") || "");

  const payload = {
    restaurant_id: restaurantId,
    name_en: String(formData.get("name_en") || ""),
    name_ar: String(formData.get("name_ar") || ""),
    sort_order: Number(formData.get("sort_order") || 0),
  };

  if (id) {
    await supabase.from("menu_categories").update(payload).eq("id", id).eq("restaurant_id", restaurantId);
  } else {
    await supabase.from("menu_categories").insert(payload);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/items");
}

export async function deleteCategory(formData: FormData) {
  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/categories");
    return;
  }

  const { supabase, restaurantId } = await currentRestaurantId();
  await supabase
    .from("menu_categories")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("restaurant_id", restaurantId);
  revalidatePath("/admin/categories");
}

export async function upsertItem(formData: FormData) {
  if (!hasSupabaseEnv()) {
    const result = await saveLocalItem(formData);
    revalidatePath("/admin/items");
    revalidatePath("/menu");
    revalidatePath("/menu/demo");
    revalidatePath("/menu/tenders-cart");
    redirect(
      result.ok
        ? `/admin/items?success=${encodeURIComponent(result.message)}`
        : `/admin/items?error=${encodeURIComponent(result.message)}`,
    );
  }

  const { supabase, restaurantId } = await currentRestaurantId();
  const id = String(formData.get("id") || "");
  const categoryId = String(formData.get("category_id") || "");

  const payload = {
    restaurant_id: restaurantId,
    category_id: categoryId || null,
    name_en: String(formData.get("name_en") || ""),
    name_ar: String(formData.get("name_ar") || ""),
    description_en: String(formData.get("description_en") || "") || null,
    description_ar: String(formData.get("description_ar") || "") || null,
    price: Number(formData.get("price") || 0),
    image_url: String(formData.get("image_url") || "") || null,
    is_available: formData.get("is_available") === "on",
  };

  if (id) {
    await supabase.from("menu_items").update(payload).eq("id", id).eq("restaurant_id", restaurantId);
  } else {
    await supabase.from("menu_items").insert(payload);
  }

  revalidatePath("/admin/items");
}

export async function uploadItemImage(formData: FormData) {
  const itemId = String(formData.get("id") || "");
  const fallbackUrl = String(formData.get("image_url") || "");
  const file = formData.get("image_file");

  if (!itemId) {
    return;
  }

  if (!hasSupabaseEnv()) {
    if (file instanceof File) {
      await saveLocalItemImage(itemId, file, fallbackUrl);
    } else if (fallbackUrl.trim()) {
      await saveLocalItemImage(itemId, new File([], ""), fallbackUrl);
    }
    revalidatePath("/admin/items");
    revalidatePath("/menu");
    revalidatePath("/menu/demo");
    revalidatePath("/menu/tenders-cart");
    return;
  }

  await upsertItem(formData);
}

export async function deleteItem(formData: FormData) {
  if (!hasSupabaseEnv()) {
    await deleteLocalItem(String(formData.get("id") || ""));
    revalidatePath("/admin/items");
    revalidatePath("/menu");
    revalidatePath("/menu/demo");
    revalidatePath("/menu/tenders-cart");
    return;
  }

  const { supabase, restaurantId } = await currentRestaurantId();
  await supabase
    .from("menu_items")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("restaurant_id", restaurantId);
  revalidatePath("/admin/items");
}

export async function updateOrderStatus(formData: FormData) {
  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/orders");
    return;
  }

  const { supabase, restaurantId } = await currentRestaurantId();
  const status = String(formData.get("status")) as OrderStatus;
  await supabase
    .from("orders")
    .update({ status })
    .eq("id", String(formData.get("id")))
    .eq("restaurant_id", restaurantId);
  revalidatePath("/admin/orders");
}

export async function createOrder(input: {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  total: number;
  items: OrderLineItem[];
}) {
  if (!hasSupabaseEnv()) {
    const id = await saveLocalOrder(input);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
    return id;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      restaurant_id: input.restaurantId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      delivery_address: input.deliveryAddress,
      notes: input.notes || null,
      total: input.total,
      items: input.items,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}
