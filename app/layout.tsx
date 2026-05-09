import type { Metadata } from "next";
import { activeRestaurantConfig } from "@/lib/mock-data";
import "./globals.css";

const brand = activeRestaurantConfig.branding;

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
