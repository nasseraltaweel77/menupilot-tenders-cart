"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createOrder } from "@/app/admin/actions";
import type { RestaurantBrandConfig } from "@/config/restaurants/types";
import { getBrandCssVars } from "@/lib/brand";
import { dictionaries, formatMoney, type Locale } from "@/lib/i18n";
import { activeRestaurantConfig } from "@/lib/mock-data";
import type { MenuCategory, MenuItem, OrderLineItem, Restaurant } from "@/types/database";

type CartLine = OrderLineItem;
type Customer = {
  name: string;
  phone: string;
  deliveryDate: string;
  deliveryTime: string;
  address: string;
  locationLink: string;
  notes: string;
};

const initialCustomer: Customer = {
  name: "",
  phone: "",
  deliveryDate: "",
  deliveryTime: "",
  address: "",
  locationLink: "",
  notes: "",
};

const checkoutFieldClass = "field h-12 rounded-xl border-[#d6ad60]/35 bg-[#fffaf0] px-4 py-2 text-[16px] leading-6 text-[#1c100c] placeholder:text-stone-500 shadow-inner shadow-[#6f1d2b]/5 transition duration-200 ease-out focus:-translate-y-0.5 focus:border-[#d6ad60] focus:shadow-[0_0_0_4px_rgba(214,173,96,0.16)] focus:ring-0";
const checkoutLabelClass = "mb-1.5 block text-sm font-bold text-[#f4d8a4]";
const checkoutHelpClass = "mt-1.5 text-xs font-semibold text-[#cdbd9f]";

export function MenuView({
  restaurant,
  categories,
  items,
  initialLocale,
  brandConfig = activeRestaurantConfig,
}: {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  initialLocale: Locale;
  brandConfig?: RestaurantBrandConfig;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [locationStatus, setLocationStatus] = useState("");
  const [orderId, setOrderId] = useState("");
  const [showOrderToast, setShowOrderToast] = useState(false);
  const [showCartToast, setShowCartToast] = useState(false);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentPending, setPaymentPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cartToastTimer = useRef<number | null>(null);
  const t = dictionaries[locale];
  const brand = brandConfig.branding;
  const social = brandConfig.contact.socialLinks;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const locationSuccess = locationStatus === t.locationSuccess;
  const minDeliveryDate = new Date().toISOString().split("T")[0];

  function label(item: MenuItem | MenuCategory, key: "name" | "description") {
    const field = `${key}_${locale}` as keyof typeof item;
    return String(item[field] || "");
  }

  function updateCustomer(field: keyof Customer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function addItem(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((line) => line.item_id === item.id);
      if (existing) {
        return current.map((line) => line.item_id === item.id ? { ...line, quantity: line.quantity + 1 } : line);
      }
      return [...current, {
        item_id: item.id,
        name_en: item.name_en,
        name_ar: item.name_ar,
        price: item.price,
        quantity: 1,
      }];
    });
    setShowCartToast(true);
    if (cartToastTimer.current) {
      window.clearTimeout(cartToastTimer.current);
    }
    cartToastTimer.current = window.setTimeout(() => setShowCartToast(false), 2600);
  }

  function removeItem(itemId: string) {
    setCart((current) => current.flatMap((line) => {
      if (line.item_id !== itemId) return [line];
      if (line.quantity <= 1) return [];
      return [{ ...line, quantity: line.quantity - 1 }];
    }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus(t.locationDenied);
      return;
    }

    setLocationStatus(t.locationLoading);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateCustomer("locationLink", `https://maps.google.com/?q=${latitude},${longitude}`);
        setLocationStatus(t.locationSuccess);
      },
      () => {
        setLocationStatus(t.locationDenied);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function buildOrderNotes() {
    return [
      customer.deliveryDate ? `Delivery date: ${customer.deliveryDate}` : "",
      customer.deliveryTime ? `Delivery time: ${customer.deliveryTime}` : "",
      customer.locationLink ? `Location: ${customer.locationLink}` : "",
      customer.notes,
    ].filter(Boolean).join(" | ");
  }

  function validateCheckout() {
    if (!cart.length) {
      setError(t.emptyCart);
      return false;
    }

    if (!customer.name || !customer.phone || !customer.deliveryDate || !customer.deliveryTime || !customer.address) {
      setError(locale === "ar" ? "يرجى إكمال بيانات الطلب." : "Please complete the checkout details.");
      return false;
    }

    return true;
  }

  async function saveOrder() {
    const id = await createOrder({
      restaurantId: restaurant.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryAddress: customer.address,
      notes: buildOrderNotes(),
      total,
      items: cart,
    });
    setOrderId(id);
    setShowOrderToast(true);
    window.setTimeout(() => setShowOrderToast(false), 3600);
    return id;
  }

  function buildWhatsappMessage(savedOrderId?: string) {
    return [
      `${brand.name} Order`,
      savedOrderId ? `Order: ${savedOrderId}` : "",
      "",
      "Products:",
      ...cart.map((item) => `${item.quantity} x ${item.name_ar} / ${item.name_en} - ${formatMoney(item.price * item.quantity, restaurant.currency, "en")}`),
      "",
      `Total: ${formatMoney(total, restaurant.currency, "en")}`,
      "",
      `Customer: ${customer.name || "-"}`,
      `Phone: ${customer.phone || "-"}`,
      `Delivery date: ${customer.deliveryDate || "-"}`,
      `Delivery time: ${customer.deliveryTime || "-"}`,
      `Address: ${customer.address || "-"}`,
      `Location: ${customer.locationLink || "-"}`,
      `Notes: ${customer.notes || "-"}`,
    ].join("\n");
  }

  function sendViaWhatsapp() {
    setError("");
    startTransition(async () => {
      try {
        if (!validateCheckout()) return;
        const id = await saveOrder();
        const url = `https://wa.me/${restaurant.phone}?text=${encodeURIComponent(buildWhatsappMessage(id))}`;
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : locale === "ar" ? "تعذر حفظ الطلب." : "Unable to save order.");
      }
    });
  }

  async function payNow() {
    setPaymentError("");
    setError("");
    if (!validateCheckout()) return;
    setPaymentPending(true);

    try {
      const response = await fetch("/api/payments/moyasar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          deliveryAddress: customer.address,
          notes: buildOrderNotes(),
          total,
          currency: restaurant.currency,
          items: cart,
        }),
      });
      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || t.paymentError);
      }

      window.location.href = data.url;
    } catch (caught) {
      setPaymentError(caught instanceof Error ? caught.message : t.paymentError);
      setPaymentPending(false);
    }
  }
  
  const whatsappUrl = `https://wa.me/${restaurant.phone}`;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#120806] text-[#fff7e8]" dir={dir} style={getBrandCssVars(brandConfig)}>
      {showOrderToast ? (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-[toastIn_0.35s_ease-out] rounded-xl border border-[#d6ad60]/40 bg-[#21110d] px-5 py-3 text-center text-sm font-bold text-[#f4d8a4] shadow-2xl shadow-black/40">
          {t.orderSaved}
        </div>
      ) : null}
      {showCartToast ? (
        <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-[toastUp_0.32s_ease-out] rounded-2xl border border-[#d6ad60]/45 bg-[linear-gradient(135deg,#2a1511,#170a08_62%,#6f1d2b)] px-5 py-3 text-center text-sm font-black text-[#fff7e8] shadow-2xl shadow-black/45 ring-1 ring-[#f4d8a4]/10 sm:bottom-6" role="status" aria-live="polite">
          <span className="mx-auto mb-2 block h-px max-w-24 bg-gradient-to-r from-transparent via-[#f4d8a4]/70 to-transparent" />
          {t.itemAdded}
        </div>
      ) : null}

      <header className="border-b border-[#d6ad60]/20 bg-[#1a0d0a]/95 shadow-lg shadow-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <Link href="/" className="group min-w-0 cursor-pointer rounded-xl outline-none transition duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#d6ad60]/50">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#d6ad60] sm:tracking-[0.22em]">
              {social.instagram ? `@${social.instagram} · ` : ""}{brand.city}
            </p>
            <h1 className="mt-1 truncate font-serif text-2xl font-semibold tracking-[0.08em] text-[#fff7e8] drop-shadow-[0_0_14px_rgba(244,216,164,0.16)] transition group-hover:text-[#f4d8a4]">{restaurant.name}</h1>
          </Link>
          <button className="min-h-11 shrink-0 rounded-xl border border-[#d6ad60]/45 px-3 py-2 text-sm font-semibold text-[#f4d8a4] transition hover:bg-[#d6ad60]/10 active:scale-[0.98]" onClick={() => setLocale(locale === "en" ? "ar" : "en")}>
            {t.language}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-3 py-4 sm:px-5 sm:py-6">
        <div className="mb-5 animate-[slideUpFade_0.55s_ease-out] rounded-xl border border-[#d6ad60]/25 bg-[linear-gradient(135deg,rgba(42,21,17,0.98),rgba(26,13,10,0.96)_55%,rgba(111,29,43,0.35))] p-4 shadow-2xl shadow-black/25 sm:mb-6 sm:p-6">
          <p className="text-sm font-semibold text-[#d6ad60]">{locale === "ar" ? brand.taglineAr : brand.tagline}</p>
          <h2 className="mt-2 break-words font-serif text-4xl font-semibold tracking-[0.08em] text-[#fff7e8] drop-shadow-[0_0_18px_rgba(244,216,164,0.18)] sm:text-5xl">{brand.logoText}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#e8d7bd]">
            {locale === "ar"
              ? "حلويات تُصنع بشغف… وتجربة تُقدَّم بذوق."
              : "Crafted with passion. Served with elegance."}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            {categories.map((category) => {
              const categoryItems = items.filter((item) => item.category_id === category.id);
              if (!categoryItems.length) return null;
              return (
                <section key={category.id} className="min-w-0">
                  <div className="mb-4 flex min-w-0 items-end justify-between gap-3 border-b border-[#d6ad60]/25 pb-3">
                    <h2 className="min-w-0 break-words text-xl font-bold text-[#f4d8a4]">{label(category, "name")}</h2>
                    <span className="h-px w-16 shrink-0 bg-gradient-to-r from-transparent via-[#d6ad60]/60 to-transparent" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categoryItems.map((item, index) => (
                      <article key={item.id} className="group min-w-0 animate-[slideUpFade_0.5s_ease-out] overflow-hidden rounded-xl border border-[#d6ad60]/20 bg-[linear-gradient(180deg,#24120e,#1a0d0a)] p-2 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-[#d6ad60]/55 hover:shadow-2xl hover:shadow-black/40 active:scale-[0.99]">
                        {item.image_url ? (
                          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#140b08]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url}
                              alt={label(item, "name")}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              loading={index < 2 ? "eager" : "lazy"}
                              decoding="async"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/20 opacity-70" />
                          </div>
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-[radial-gradient(circle_at_top,#6f1d2b,#2a1511_58%,#140b08)] transition duration-500 group-hover:brightness-110">
                            <div className="rounded-full border border-[#d6ad60]/45 px-5 py-3 text-center transition duration-300 group-hover:border-[#f4d8a4]">
                              <p className="text-xs uppercase tracking-[0.2em] text-[#d6ad60]">{brand.shortName}</p>
                              <p className="text-sm font-bold text-[#fff7e8]">{restaurant.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="p-3.5">
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="break-words font-bold leading-6 text-[#fff7e8]">{label(item, "name")}</h3>
                              <p className="mt-1 break-words text-xs text-[#d6ad60]">{locale === "ar" ? brand.name : item.name_en}</p>
                            </div>
                            <p className="shrink-0 text-sm font-bold text-[#f4d8a4]">{formatMoney(item.price, restaurant.currency, locale)}</p>
                          </div>
                          <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#b88b8f]">{label(item, "description")}</p>
                          <button className="mt-4 min-h-11 w-full rounded-xl bg-gradient-to-r from-[#6f1d2b] to-[#8a2638] px-4 py-2 text-sm font-bold text-[#fff7e8] shadow-lg shadow-[#6f1d2b]/15 transition hover:shadow-[#6f1d2b]/35 active:scale-[0.98]" onClick={() => addItem(item)}>
                            {t.addToCart}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="h-fit min-w-0 rounded-xl border border-[#d6ad60]/25 bg-[linear-gradient(180deg,#24120e,#170a08)] p-4 shadow-2xl shadow-black/30 sm:p-5 lg:sticky lg:top-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[#f4d8a4]">{t.cart}</h2>
              <span className="min-w-10 rounded-full border border-[#d6ad60]/30 bg-[#140b08] px-3 py-1 text-center text-xs font-black text-[#f4d8a4]">{cartCount}</span>
            </div>
            <div className="mt-4 space-y-3">
              {cart.length ? cart.map((line) => (
                <div key={line.item_id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[#d6ad60]/10 bg-[#140b08] p-3 transition hover:bg-[#1c100c]">
                  <div className="min-w-0">
                    <p className="break-words font-semibold leading-6">{locale === "ar" ? line.name_ar : line.name_en}</p>
                    <p className="text-sm text-[#cdbd9f]">{line.quantity} x {formatMoney(line.price, restaurant.currency, locale)}</p>
                  </div>
                  <button className="min-h-10 rounded-lg border border-[#d6ad60]/30 px-3 py-1 text-sm font-semibold text-[#f4d8a4] transition hover:bg-[#d6ad60]/10 active:scale-[0.98]" onClick={() => removeItem(line.item_id)}>
                    {t.remove}
                  </button>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-[#d6ad60]/35 bg-[#140b08]/70 px-4 py-6 text-center shadow-inner shadow-black/20">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#d6ad60]/35 text-[#d6ad60]">R</div>
                  <p className="font-bold text-[#f4d8a4]">{t.emptyCart}</p>
                  <p className="mt-2 text-xs leading-5 text-[#cdbd9f]">{t.emptyCartHint}</p>
                </div>
              )}
            </div>
            <div className="my-4 flex items-center justify-between gap-4 border-t border-[#d6ad60]/20 pt-4 font-bold text-[#f4d8a4]">
              <span>{t.total}</span>
              <span className="shrink-0">{formatMoney(total, restaurant.currency, locale)}</span>
            </div>

            {orderId ? <p className="mb-4 break-words rounded-xl bg-[#d6ad60]/15 px-3 py-2 text-sm font-semibold text-[#f4d8a4]">{t.orderSaved}: {orderId}</p> : null}
            {error ? <p className="mb-4 break-words rounded-xl bg-[#6f1d2b]/40 px-3 py-2 text-sm font-semibold text-[#fff7e8]">{error}</p> : null}
            {paymentError ? <p className="mb-4 break-words rounded-xl bg-[#6f1d2b]/40 px-3 py-2 text-sm font-semibold text-[#fff7e8]">{paymentError}</p> : null}

            <div className="space-y-3.5 sm:space-y-4">
              <input className={checkoutFieldClass} name="name" placeholder={t.name} value={customer.name} onChange={(event) => updateCustomer("name", event.target.value)} required />
              <input className={checkoutFieldClass} name="phone" inputMode="tel" placeholder={t.phone} value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} required />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={checkoutLabelClass}>{t.deliveryDate}</span>
                  <input
                    className={checkoutFieldClass}
                    type="date"
                    name="deliveryDate"
                    min={minDeliveryDate}
                    value={customer.deliveryDate}
                    onChange={(event) => updateCustomer("deliveryDate", event.target.value)}
                    required
                    dir="rtl"
                    aria-label={t.deliveryDate}
                  />
                  <span className={checkoutHelpClass}>{t.chooseDeliveryDate}</span>
                </label>
                <label className="block">
                  <span className={checkoutLabelClass}>{t.deliveryTime}</span>
                  <input
                    className={checkoutFieldClass}
                    type="time"
                    name="deliveryTime"
                    value={customer.deliveryTime}
                    onChange={(event) => updateCustomer("deliveryTime", event.target.value)}
                    required
                    dir="rtl"
                    aria-label={t.deliveryTime}
                  />
                  <span className={checkoutHelpClass}>{t.chooseDeliveryTime}</span>
                </label>
              </div>
              <textarea className={`${checkoutFieldClass} min-h-24`} name="address" placeholder={t.address} value={customer.address} onChange={(event) => updateCustomer("address", event.target.value)} required />
              <button className="min-h-12 w-full rounded-xl border border-[#d6ad60]/45 bg-[#21110d]/60 px-4 py-3 text-sm font-bold text-[#f4d8a4] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#d6ad60]/10 active:scale-[0.98]" type="button" onClick={useCurrentLocation}>
                {t.locationButton}
              </button>
              {locationStatus ? (
                <p className={`break-words rounded-xl px-3 py-2 text-sm font-semibold transition ${locationSuccess ? "animate-[pulse_0.9s_ease-out_1] bg-[#d6ad60]/15 text-[#f4d8a4] ring-1 ring-[#d6ad60]/30" : "text-[#f4d8a4]"}`}>
                  {locationStatus}
                </p>
              ) : null}
              <input className={checkoutFieldClass} name="locationLink" placeholder={t.locationField} value={customer.locationLink} readOnly aria-label={t.locationField} />
              <textarea className={`${checkoutFieldClass} min-h-24`} name="notes" placeholder={t.notes} value={customer.notes} onChange={(event) => updateCustomer("notes", event.target.value)} />
            </div>
            <button
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#f4d8a4] via-[#d6ad60] to-[#8a2638] px-4 py-3 text-sm font-black text-[#140b08] shadow-xl shadow-[#d6ad60]/20 transition hover:-translate-y-0.5 hover:shadow-[#d6ad60]/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              type="button"
              onClick={payNow}
              disabled={!cart.length || paymentPending}
            >
              {paymentPending ? t.paymentCreating : t.payNow}
            </button>
            <p className="mt-2 text-center text-xs font-semibold text-[#cdbd9f]">{t.paymentMethods}</p>
            <button className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border border-[#d6ad60]/45 bg-[#21110d]/60 px-4 py-3 text-sm font-bold text-[#f4d8a4] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#d6ad60]/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70" type="button" onClick={sendViaWhatsapp} disabled={!cart.length || isPending}>
              {isPending ? t.savingOrder : t.sendWhatsapp}
            </button>
          </aside>
        </div>
      </section>

      <a
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[#d6ad60]/50 bg-[#21110d] text-sm font-black text-[#f4d8a4] shadow-2xl shadow-black/35 transition hover:-translate-y-1 hover:bg-[#2a1511] hover:shadow-[#d6ad60]/10 sm:left-6"
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
      >
        WA
      </a>
    </main>
  );
}
