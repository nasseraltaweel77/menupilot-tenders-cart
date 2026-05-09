import type { CSSProperties } from "react";
import type { RestaurantBrandConfig } from "@/config/restaurants/types";
import { activeRestaurantConfig } from "@/lib/mock-data";

export function getBrandCssVars(config: RestaurantBrandConfig = activeRestaurantConfig): CSSProperties {
  const { branding } = config;

  return {
    "--brand-primary": branding.primaryColor,
    "--brand-secondary": branding.secondaryColor,
    "--brand-accent": branding.accentColor,
    "--brand-background": branding.backgroundColor,
  } as CSSProperties;
}
