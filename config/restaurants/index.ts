import { romaPastryConfig } from "@/config/restaurants/roma-pastry";
import type { RestaurantBrandConfig } from "@/config/restaurants/types";

export const restaurants = [romaPastryConfig] as const satisfies readonly RestaurantBrandConfig[];

export const restaurantConfigs = Object.fromEntries(
  restaurants.flatMap((config) => [
    [config.restaurant.id, config],
    [config.restaurant.slug, config],
    ...config.aliases.map((alias) => [alias, config] as const),
  ]),
) as Record<string, RestaurantBrandConfig>;

export const defaultRestaurantConfig = romaPastryConfig;

export function getRestaurantConfig(slug?: string) {
  if (!slug) {
    return defaultRestaurantConfig;
  }

  return restaurantConfigs[slug as keyof typeof restaurantConfigs] || defaultRestaurantConfig;
}

export function getRestaurantConfigById(restaurantId?: string) {
  return restaurants.find((config) => config.restaurant.id === restaurantId) || defaultRestaurantConfig;
}

export function getRestaurantConfigByDomain(host?: string | null) {
  const normalizedHost = host?.split(":")[0]?.toLowerCase();
  if (!normalizedHost) {
    return defaultRestaurantConfig;
  }

  return restaurants.find((config) =>
    config.customDomains.some((domain) => domain.toLowerCase() === normalizedHost),
  ) || defaultRestaurantConfig;
}
