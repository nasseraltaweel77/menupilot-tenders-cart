import type { RestaurantBrandConfig } from "@/config/restaurants/types";
import type { MenuCategory, MenuItem } from "@/types/database";

const now = new Date();
const restaurantId = "tenders-cart";

export const tendersCartConfig: RestaurantBrandConfig = {
  restaurant: {
    id: restaurantId,
    owner_id: "mock-admin",
    name: "Tenders Cart",
    slug: "tenders-cart",
    phone: "966500000000",
    currency: "SAR",
    created_at: now.toISOString(),
  },
  aliases: ["tenders", "tenders-cart"],
  customDomains: [],
  branding: {
    name: "Tenders Cart",
    shortName: "TC",
    logoText: "Tenders Cart",
    logoUrl: null,
    city: "Saudi Arabia",
    tagline: "Premium crispy chicken, bold sauce energy.",
    taglineAr: "دجاج كرسبي فاخر ونكهات صوص جريئة.",
    description: "A premium fried chicken fast food brand built around juicy tenders, bold burgers, wraps, fries, and signature sauces.",
    descriptionAr: "تجربة دجاج مقلي فاخرة مع تندرز، برجر، وجبات، راب، بطاطس، وصوصات مميزة.",
    primaryColor: "#f25a1d",
    secondaryColor: "#c92216",
    accentColor: "#ffb000",
    backgroundColor: "#f7ead5",
    currency: "SAR",
  },
  contact: {
    whatsappNumber: "966500000000",
    whatsappDisplay: "0500000000",
    socialLinks: {
      instagram: "tenders.cart",
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
    storagePrefix: "tenders",
    orderPrefix: "TC",
    menuItemsTable: "tenders_menu_items",
    ordersTable: "tenders_orders",
    pendingPaymentsTable: "tenders_pending_payments",
  },
  categories: [
    category("cat-burgers", "Burgers & Sandwiches", "برجر وساندويتش", 1),
    category("cat-meals", "Meals", "وجبات", 2),
    category("cat-tenders", "Chicken Tenders", "تندرز الدجاج", 3),
    category("cat-sides", "Sides", "إضافات", 4),
    category("cat-sauces", "Sauces", "صوصات", 5),
  ],
  menuItems: [
    item("item-sos-burger", "cat-burgers", "SOS Burger", "برجر SOS", 25, "Crispy chicken, soft bun, pickles, and bold SOS sauce."),
    item("item-original-burger", "cat-burgers", "Original Burger", "برجر أوريجنال", 25, "Golden chicken fillet with classic Tenders Cart flavor."),
    item("item-tc-mango-sandwich", "cat-burgers", "TC Mango Sandwich", "ساندويتش TC مانجو", 28, "Crispy chicken with sweet-spicy mango sauce."),
    item("item-sos-meal", "cat-meals", "SOS Meal", "وجبة SOS", 33, "SOS burger served as a complete fast food meal."),
    item("item-original-meal", "cat-meals", "Original Meal", "وجبة أوريجنال", 32, "Original burger meal with a crispy premium bite."),
    item("item-tc-mango-meal", "cat-meals", "TC Mango Meal", "وجبة TC مانجو", 35, "Mango sandwich meal with a bright sweet-spicy finish."),
    item("item-3pcs-tenders", "cat-tenders", "3 PCS Chicken Tenders", "3 قطع تندرز دجاج", 29, "Three juicy chicken tenders fried until crisp."),
    item("item-5pcs-tenders", "cat-tenders", "5 PCS Chicken Tenders", "5 قطع تندرز دجاج", 39, "Five crispy tenders for bigger cravings."),
    item("item-3pcs-tenders-meal", "cat-tenders", "3 PCS Chicken Tenders Meal", "وجبة 3 قطع تندرز", 36, "Three-piece tenders meal with the full Tenders Cart experience."),
    item("item-5pcs-tenders-meal", "cat-tenders", "5 PCS Chicken Tenders Meal", "وجبة 5 قطع تندرز", 45, "Five-piece tenders meal made for serious crispy chicken fans."),
    item("item-chicken-wrap", "cat-burgers", "Chicken Wrap", "راب دجاج", 14, "A quick crispy chicken wrap with signature flavor."),
    item("item-french-fries", "cat-sides", "French Fries", "بطاطس مقلية", 7, "Hot, golden, lightly salted fries."),
    item("item-mozzarella-sticks", "cat-sides", "Mozzarella Sticks", "أصابع موزاريلا", 17, "Crispy mozzarella sticks with a melty center."),
    item("item-bbq", "cat-sauces", "BBQ", "باربكيو", 2, "Smoky BBQ sauce."),
    item("item-ranch", "cat-sauces", "Ranch", "رانش", 2, "Creamy ranch sauce."),
    item("item-mango", "cat-sauces", "Mango", "مانجو", 3, "Sweet and tangy mango sauce."),
    item("item-honey-mustard", "cat-sauces", "Honey Mustard", "هني مسترد", 2, "Honey mustard sauce."),
    item("item-mayo-sriracha", "cat-sauces", "Mayo Sriracha", "مايو سريراتشا", 2, "Creamy spicy mayo sriracha."),
    item("item-garlic", "cat-sauces", "Garlic", "ثوم", 2, "Rich garlic sauce."),
    item("item-cheese", "cat-sauces", "Cheese", "جبن", 3, "Warm cheese sauce."),
    item("item-old-bay", "cat-sauces", "Old Bay", "أولد باي", 2, "Old Bay seasoned sauce."),
  ],
};

function category(id: string, name_en: string, name_ar: string, sort_order: number): MenuCategory {
  return { id, restaurant_id: restaurantId, name_en, name_ar, sort_order, created_at: now.toISOString() };
}

function item(id: string, category_id: string, name_en: string, name_ar: string, price: number, description: string): MenuItem {
  return {
    id,
    restaurant_id: restaurantId,
    category_id,
    name_en,
    name_ar,
    description_en: description,
    description_ar: "اختيار كرسبي من تندرز كارت بنكهة جريئة وجودة فاخرة.",
    price,
    image_url: null,
    is_available: true,
    created_at: now.toISOString(),
  };
}
