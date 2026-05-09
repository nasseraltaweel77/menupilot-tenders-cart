import { defaultRestaurantConfig } from "@/config/restaurants";

export function hasSupabaseEnv() {
  return false;
}

export const activeRestaurantConfig = defaultRestaurantConfig;
export const mockRestaurant = activeRestaurantConfig.restaurant;
export const mockCategories = activeRestaurantConfig.categories;
export const mockItems = activeRestaurantConfig.menuItems;

export const romaMeta = {
  city: activeRestaurantConfig.branding.city,
  instagram: activeRestaurantConfig.contact.socialLinks.instagram || "",
  tagline: activeRestaurantConfig.branding.tagline,
  taglineAr: activeRestaurantConfig.branding.taglineAr,
  whatsappDisplay: activeRestaurantConfig.contact.whatsappDisplay,
};
