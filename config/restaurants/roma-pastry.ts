import type { RestaurantBrandConfig } from "@/config/restaurants/types";
import type { MenuCategory, MenuItem } from "@/types/database";

const now = new Date();
const romaRestaurantId = "roma-pastry";

export const romaPastryConfig: RestaurantBrandConfig = {
  restaurant: {
    id: romaRestaurantId,
    owner_id: "mock-admin",
    name: "Roma Pastry",
    slug: "roma",
    phone: "966545199610",
    currency: "SAR",
    created_at: now.toISOString(),
  },
  aliases: ["roma", "roma-pastry"],
  customDomains: [],
  branding: {
    name: "Roma Pastry",
    shortName: "Roma",
    logoText: "Roma Pastry",
    logoUrl: null,
    city: "Jeddah",
    tagline: "Follow the sweetest road to Rome",
    taglineAr: "اتبع أحلى طريق إلى روما",
    description: "A refined Italian and French pastry experience from Jeddah, crafted for elegant gifting, celebrations, and indulgent everyday moments.",
    descriptionAr: "حلويات تُصنع بشغف… وتجربة تُقدَّم بذوق.",
    primaryColor: "#d6ad60",
    secondaryColor: "#6f1d2b",
    accentColor: "#f4d8a4",
    backgroundColor: "#120806",
    currency: "SAR",
  },
  contact: {
    whatsappNumber: "966545199610",
    whatsappDisplay: "0545199610",
    socialLinks: {
      instagram: "romapastry.sa",
    },
  },
  payments: {
    provider: "moyasar",
    enabled: true,
    currency: "SAR",
    supportedMethods: ["Apple Pay", "Mada", "Visa", "Mastercard"],
    secretKeyEnv: "MOYASAR_SECRET_KEY",
    publishableKeyEnv: "NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY",
  },
  data: {
    storagePrefix: "roma",
    orderPrefix: "ROMA",
    menuItemsTable: "roma_menu_items",
    ordersTable: "roma_orders",
    pendingPaymentsTable: "roma_pending_payments",
  },
  categories: [
    category("cat-signature", "Signature", "سيجنتشر", 1),
    category("cat-millefeuille", "Millefeuille Bites", "ميلفيه بايتس", 2),
    category("cat-cheesecakes", "Cheesecakes", "تشيز كيك", 3),
    category("cat-italian-french", "Italian & French Desserts", "حلويات إيطالية وفرنسية", 4),
    category("cat-platters", "Platters", "بلاترز", 5),
    category("cat-macarons", "Macarons", "ماكرون", 6),
  ],
  menuItems: [
    item("item-original", "cat-millefeuille", "Original Millefeuille Bites", "ميلفيه بايتس أورجنال", 79),
    item("item-mix", "cat-millefeuille", "Mixed Millefeuille Bites", "ميلفيه بايتس مكس", 89),
    item("item-savory", "cat-millefeuille", "Savory Millefeuille Bites", "ميلفيه بايتس مالح", 86),
    item("item-signature", "cat-signature", "Roma Signature", "روما سيجنتشر", 145),
    item("item-madrid-classic", "cat-cheesecakes", "Madrid Classic Cheesecake", "تشيز كيك مدريد كلاسيك", 129),
    item("item-madrid-mix", "cat-cheesecakes", "Madrid Mixed Cheesecake", "تشيز كيك مدريد مكس", 139),
    item("item-chocolate-madrid", "cat-cheesecakes", "Chocolate Madrid Cheesecake", "تشوكلت مدريد تشيز كيك", 139),
    item("item-italian-french-box", "cat-italian-french", "Italian & French Desserts Box", "بوكس الحلويات الإيطالية والفرنسية", 159),
    item("item-eclair-platter", "cat-platters", "Eclair Platter", "إكلير بلاتر", 119),
    item("item-roma-show", "cat-platters", "Roma Show", "روما شو", 189),
    item("item-macaron", "cat-macarons", "Macarons", "ماكرون", 95),
  ],
};

function category(id: string, name_en: string, name_ar: string, sort_order: number): MenuCategory {
  return { id, restaurant_id: romaRestaurantId, name_en, name_ar, sort_order, created_at: now.toISOString() };
}

function item(id: string, category_id: string, name_en: string, name_ar: string, price: number): MenuItem {
  return {
    id,
    restaurant_id: romaRestaurantId,
    category_id,
    name_en,
    name_ar,
    description_en: "A refined Roma Pastry selection prepared for elegant occasions.",
    description_ar: "اختيار فاخر من روما باستري يليق بالمناسبات الراقية.",
    price,
    image_url: null,
    is_available: true,
    created_at: now.toISOString(),
  };
}
