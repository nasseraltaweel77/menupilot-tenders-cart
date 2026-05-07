import { promises as fs } from "fs";
import path from "path";
import { mockItems } from "@/lib/mock-data";
import { getProductionStorageClient, hasProductionStorage, isVercelRuntime } from "@/lib/production-storage";
import type { MenuItem } from "@/types/database";

const dataDir = path.join(process.cwd(), "data");
const uploadsDir = path.join(process.cwd(), "public", "uploads");
const imageMapPath = path.join(dataDir, "item-images.json");
const itemOverridesPath = path.join(dataDir, "items.json");
const deletedItemsPath = path.join(dataDir, "deleted-items.json");

type ImageMap = Record<string, string>;
type ItemOverrides = Record<string, Partial<MenuItem>>;

export async function getMockItemsWithImages(): Promise<MenuItem[]> {
  const imageMap = await readImageMap();
  const itemOverrides = await readItemOverrides();
  const deletedItems = await readDeletedItems();
  return mockItems
    .filter((item) => !deletedItems.includes(item.id))
    .map((item) => ({
      ...item,
      ...itemOverrides[item.id],
      image_url: imageMap[item.id] || itemOverrides[item.id]?.image_url || item.image_url,
    }));
}

export async function saveLocalItem(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) {
    return;
  }

  const currentImageUrl = String(formData.get("current_image_url") || "").trim();
  const submittedImageUrl = String(formData.get("image_url") || "").trim();
  const imageUrl = submittedImageUrl || (currentImageUrl.startsWith("/uploads/") ? currentImageUrl : "");

  const itemOverrides = await readItemOverrides();
  itemOverrides[id] = {
    ...itemOverrides[id],
    id,
    category_id: String(formData.get("category_id") || "") || null,
    name_en: String(formData.get("name_en") || ""),
    name_ar: String(formData.get("name_ar") || ""),
    description_en: String(formData.get("description_en") || "") || null,
    description_ar: String(formData.get("description_ar") || "") || null,
    price: Number(formData.get("price") || 0),
    image_url: imageUrl || null,
    is_available: formData.get("is_available") === "on",
  };

  if (isVercelRuntime()) {
    await saveProductionItemOverride(id, itemOverrides[id]);
    if (imageUrl) {
      await saveProductionImage(id, imageUrl);
    }
    return;
  }

  await fs.mkdir(dataDir, { recursive: true });

  await fs.writeFile(itemOverridesPath, JSON.stringify(itemOverrides, null, 2), "utf8");

  if (imageUrl) {
    const imageMap = await readImageMap();
    imageMap[id] = imageUrl;
    await fs.writeFile(imageMapPath, JSON.stringify(imageMap, null, 2), "utf8");
  }
}

export async function saveLocalItemImage(itemId: string, file: File, fallbackUrl: string) {
  let imageUrl = fallbackUrl.trim();

  if (file.size > 0) {
    if (isVercelRuntime()) {
      const bytes = Buffer.from(await file.arrayBuffer());
      imageUrl = `data:${file.type || "image/jpeg"};base64,${bytes.toString("base64")}`;
    } else {
      const extension = getSafeExtension(file.name, file.type);
      const filename = `${itemId}-${Date.now()}${extension}`;
      const destination = path.join(uploadsDir, filename);
      const bytes = new Uint8Array(await file.arrayBuffer());
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(destination, bytes);
      imageUrl = `/uploads/${filename}`;
    }
  }

  if (!imageUrl) {
    return;
  }

  if (isVercelRuntime()) {
    await saveProductionImage(itemId, imageUrl);
    return;
  }

  await fs.mkdir(dataDir, { recursive: true });
  const imageMap = await readImageMap();
  imageMap[itemId] = imageUrl;
  await fs.writeFile(imageMapPath, JSON.stringify(imageMap, null, 2), "utf8");
}

export async function deleteLocalItem(itemId: string) {
  if (!itemId) {
    return;
  }

  if (isVercelRuntime()) {
    await deleteProductionItem(itemId);
    return;
  }

  await fs.mkdir(dataDir, { recursive: true });

  const deletedItems = await readDeletedItems();
  if (!deletedItems.includes(itemId)) {
    deletedItems.push(itemId);
    await fs.writeFile(deletedItemsPath, JSON.stringify(deletedItems, null, 2), "utf8");
  }

  const itemOverrides = await readItemOverrides();
  delete itemOverrides[itemId];
  await fs.writeFile(itemOverridesPath, JSON.stringify(itemOverrides, null, 2), "utf8");
}

async function readImageMap(): Promise<ImageMap> {
  if (isVercelRuntime()) {
    return readProductionImageMap();
  }

  try {
    const raw = await fs.readFile(imageMapPath, "utf8");
    return JSON.parse(raw) as ImageMap;
  } catch {
    return {};
  }
}

async function readItemOverrides(): Promise<ItemOverrides> {
  if (isVercelRuntime()) {
    return readProductionItemOverrides();
  }

  try {
    const raw = await fs.readFile(itemOverridesPath, "utf8");
    return JSON.parse(raw) as ItemOverrides;
  } catch {
    return {};
  }
}

async function readDeletedItems(): Promise<string[]> {
  if (isVercelRuntime()) {
    return readProductionDeletedItems();
  }

  try {
    const raw = await fs.readFile(deletedItemsPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function readProductionImageMap(): Promise<ImageMap> {
  if (!hasProductionStorage()) return {};
  const supabase = getProductionStorageClient();
  const { data, error } = await supabase.from("roma_item_images").select("item_id,image_url");
  if (error) throw new Error(error.message);
  return Object.fromEntries((data || []).map((row) => [row.item_id as string, row.image_url as string]));
}

async function readProductionItemOverrides(): Promise<ItemOverrides> {
  if (!hasProductionStorage()) return {};
  const supabase = getProductionStorageClient();
  const { data, error } = await supabase.from("roma_item_overrides").select("item_id,item_data");
  if (error) throw new Error(error.message);
  return Object.fromEntries((data || []).map((row) => [row.item_id as string, row.item_data as Partial<MenuItem>]));
}

async function readProductionDeletedItems(): Promise<string[]> {
  if (!hasProductionStorage()) return [];
  const supabase = getProductionStorageClient();
  const { data, error } = await supabase.from("roma_deleted_items").select("item_id");
  if (error) throw new Error(error.message);
  return (data || []).map((row) => row.item_id as string);
}

async function saveProductionItemOverride(itemId: string, itemData: Partial<MenuItem>) {
  const supabase = getProductionStorageClient();
  const { error } = await supabase.from("roma_item_overrides").upsert({
    item_id: itemId,
    item_data: itemData,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

async function saveProductionImage(itemId: string, imageUrl: string) {
  const supabase = getProductionStorageClient();
  const { error } = await supabase.from("roma_item_images").upsert({
    item_id: itemId,
    image_url: imageUrl,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

async function deleteProductionItem(itemId: string) {
  const supabase = getProductionStorageClient();
  const { error } = await supabase.from("roma_deleted_items").upsert({
    item_id: itemId,
    deleted_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  await supabase.from("roma_item_overrides").delete().eq("item_id", itemId);
}

function getSafeExtension(filename: string, mimeType: string) {
  const extension = path.extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension)) {
    return extension;
  }

  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".jpg";
}
