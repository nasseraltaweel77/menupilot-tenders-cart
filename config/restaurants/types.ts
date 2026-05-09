import type { MenuCategory, MenuItem, Restaurant } from "@/types/database";

export type RestaurantBrandConfig = {
  restaurant: Restaurant;
  aliases: string[];
  customDomains: string[];
  branding: {
    name: string;
    shortName: string;
    logoText: string;
    logoUrl: string | null;
    city: string;
    tagline: string;
    taglineAr: string;
    description: string;
    descriptionAr: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    currency: string;
  };
  contact: {
    whatsappNumber: string;
    whatsappDisplay: string;
    socialLinks: {
      instagram?: string;
      website?: string;
      tiktok?: string;
      snapchat?: string;
    };
  };
  payments: {
    provider: "moyasar";
    enabled: boolean;
    currency: string;
    supportedMethods: string[];
    secretKeyEnv: string;
    publishableKeyEnv?: string;
  };
  data: {
    storagePrefix: string;
    orderPrefix: string;
    menuItemsTable: string;
    ordersTable: string;
    pendingPaymentsTable: string;
  };
  categories: MenuCategory[];
  menuItems: MenuItem[];
};
