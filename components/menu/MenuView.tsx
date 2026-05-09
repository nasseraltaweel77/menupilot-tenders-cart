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

const checkoutFieldClass = "field h-12 rounded-xl border-[#f25a1d]/30 bg-white px-4 py-2 text-[16px] font-semibold leading-6 text-[#351207] placeholder:text-stone-500 shadow-inner shadow-[#f25a1d]/5 transition duration-200 ease-out focus:-translate-y-0.5 focus:border-[#c92216] focus:shadow-[0_0_0_4px_rgba(242,90,29,0.16)] focus:ring-0";
const checkoutLabelClass = "mb-1.5 block text-sm font-black text-[#c92216]";
const checkoutHelpClass = "mt-1.5 text-xs font-bold text-[#8a3a18]";

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
  const instagram = brandConfig.contact.socialLinks.instagram;
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
      () => setLocationStatus(t.locationDenied),
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
        const url = `https://wa.me/${brandConfig.contact.whatsappNumber}?text=${encodeURIComponent(buildWhatsappMessage(id))}`;
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : locale === "ar" ? "تعذر حفظ الطلب." : "Unable to save order.");
        return;
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

  const whatsappUrl = `https://wa.me/${brandConfig.contact.whatsappNumber}`;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7ead5] text-[#351207]" dir={dir} style={getBrandCssVars(brandConfig)}>
      {showOrderToast ? (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-[toastIn_0.35s_ease-out] rounded-xl border border-[#ffb000]/50 bg-[#c92216] px-5 py-3 text-center text-sm font-black text-white shadow-2xl shadow-[#c92216]/25">
          {t.orderSaved}
        </div>
      ) : null}
      {showCartToast ? (
        <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-[toastUp_0.32s_ease-out] rounded-2xl border border-[#ffb000]/70 bg-[linear-gradient(135deg,#c92216,#f25a1d_62%,#ffb000)] px-5 py-3 text-center text-sm font-black text-white shadow-2xl shadow-[#c92216]/30 sm:bottom-6" role="status" aria-live="polite">
          {t.itemAdded}
        </div>
      ) : null}

      <header className="border-b-4 border-[#c92216] bg-[#fff6e8]/95 shadow-lg shadow-[#c92216]/10 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <Link href="/" className="group min-w-0 cursor-pointer rounded-xl outline-none transition duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#f25a1d]/50">
            <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-[#f25a1d] sm:tracking-[0.22em]">
              {instagram ? `@${instagram} · ` : ""}{brand.city}
            </p>
            <h1 className="mt-1 truncate text-3xl font-black uppercase tracking-[0.04em] text-[#c92216] transition group-hover:text-[#f25a1d]">
              {restaurant.name}
            </h1>
          </Link>
          <button className="min-h-11 shrink-0 rounded-xl border-2 border-[#c92216] bg-white px-3 py-2 text-sm font-black text-[#c92216] transition hover:bg-[#ffb000]/20 active:scale-[0.98]" onClick={() => setLocale(locale === "en" ? "ar" : "en")}>
            {t.language}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-3 py-4 sm:px-5 sm:py-6">
        <div className="mb-5 animate-[slideUpFade_0.55s_ease-out] rounded-2xl border-4 border-[#c92216] bg-[linear-gradient(135deg,#fff6e8,#f7ead5_55%,#ffd071)] p-4 shadow-2xl shadow-[#c92216]/15 sm:mb-6 sm:p-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f25a1d]">{locale === "ar" ? brand.taglineAr : brand.tagline}</p>
          <h2 className="mt-2 break-words text-5xl font-black uppercase tracking-[0.03em] text-[#c92216] drop-shadow-[0_6px_0_rgba(255,176,0,0.35)] sm:text-6xl">
            {brand.logoText}
          </h2>
          <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-[#6a2a13]">
            {locale === "ar" ? brand.descriptionAr : brand.description}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            {categories.map((category) => {
              const categoryItems = items.filter((item) => item.category_id === category.id);
              if (!categoryItems.length) return null;
              return (
                <section key={category.id} className="min-w-0">
                  <div className="mb-4 flex min-w-0 items-end justify-between gap-3 border-b-4 border-[#c92216]/25 pb-3">
                    <h2 className="min-w-0 break-words text-2xl font-black uppercase text-[#c92216]">{label(category, "name")}</h2>
                    <span className="h-1 w-16 shrink-0 rounded-full bg-gradient-to-r from-[#c92216] via-[#f25a1d] to-[#ffb000]" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categoryItems.map((item) => (
                      <article key={item.id} className="group min-w-0 animate-[slideUpFade_0.5s_ease-out] overflow-hidden rounded-2xl border-2 border-[#f25a1d]/30 bg-[#fffaf1] p-3 shadow-xl shadow-[#c92216]/10 transition duration-300 hover:-translate-y-1 hover:border-[#c92216] hover:shadow-2xl hover:shadow-[#c92216]/20 active:scale-[0.99]">
                        <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-[radial-gradient(circle_at_top,#ffb000,#f25a1d_58%,#c92216)] transition duration-500 group-hover:brightness-110">
                          {item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image_url} alt={label(item, "name")} className="h-full w-full rounded-xl object-cover transition duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                          ) : (
                            <div className="rounded-full border-4 border-white/70 bg-white/15 px-5 py-3 text-center text-white shadow-lg">
                              <p className="text-xs font-black uppercase tracking-[0.2em]">{brand.shortName}</p>
                              <p className="text-sm font-black uppercase">{restaurant.name}</p>
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="break-words text-lg font-black leading-6 text-[#351207]">{label(item, "name")}</h3>
                              <p className="mt-1 break-words text-xs font-black uppercase text-[#f25a1d]">{locale === "ar" ? brand.name : item.name_en}</p>
                            </div>
                            <p className="shrink-0 rounded-full bg-[#ffb000] px-3 py-1 text-sm font-black text-[#351207]">{formatMoney(item.price, restaurant.currency, locale)}</p>
                          </div>
                          <p className="mt-2 break-words text-xs font-bold leading-5 text-[#8a3a18]">{label(item, "description")}</p>
                          <button className="mt-4 min-h-11 w-full rounded-xl bg-gradient-to-r from-[#c92216] to-[#f25a1d] px-4 py-2 text-sm font-black uppercase text-white shadow-lg shadow-[#c92216]/20 transition hover:shadow-[#c92216]/35 active:scale-[0.98]" onClick={() => addItem(item)}>
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

          <aside className="h-fit min-w-0 rounded-2xl border-4 border-[#c92216] bg-[#fff6e8] p-4 shadow-2xl shadow-[#c92216]/15 sm:p-5 lg:sticky lg:top-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black uppercase text-[#c92216]">{t.cart}</h2>
              <span className="min-w-10 rounded-full bg-[#ffb000] px-3 py-1 text-center text-xs font-black text-[#351207]">{cartCount}</span>
            </div>
            <div className="mt-4 space-y-3">
              {cart.length ? cart.map((line) => (
                <div key={line.item_id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[#f25a1d]/25 bg-white p-3 transition hover:bg-[#fffaf1]">
                  <div className="min-w-0">
                    <p className="break-words font-black leading-6 text-[#351207]">{locale === "ar" ? line.name_ar : line.name_en}</p>
                    <p className="text-sm font-bold text-[#8a3a18]">{line.quantity} x {formatMoney(line.price, restaurant.currency, locale)}</p>
                  </div>
                  <button className="min-h-10 rounded-lg border-2 border-[#c92216] px-3 py-1 text-sm font-black text-[#c92216] transition hover:bg-[#ffb000]/25 active:scale-[0.98]" onClick={() => removeItem(line.item_id)}>
                    {t.remove}
                  </button>
                </div>
              )) : (
                <div className="rounded-xl border-2 border-dashed border-[#f25a1d]/45 bg-white px-4 py-6 text-center shadow-inner shadow-[#f25a1d]/5">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ffb000] text-sm font-black text-[#351207]">TC</div>
                  <p className="font-black text-[#c92216]">{t.emptyCart}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-[#8a3a18]">{t.emptyCartHint}</p>
                </div>
              )}
            </div>
            <div className="my-4 flex items-center justify-between gap-4 border-t-4 border-[#f25a1d]/20 pt-4 text-lg font-black text-[#c92216]">
              <span>{t.total}</span>
              <span className="shrink-0">{formatMoney(total, restaurant.currency, locale)}</span>
            </div>

            {orderId ? <p className="mb-4 break-words rounded-xl bg-[#ffb000]/30 px-3 py-2 text-sm font-black text-[#351207]">{t.orderSaved}: {orderId}</p> : null}
            {error ? <p className="mb-4 break-words rounded-xl bg-[#c92216] px-3 py-2 text-sm font-black text-white">{error}</p> : null}
            {paymentError ? <p className="mb-4 break-words rounded-xl bg-[#c92216] px-3 py-2 text-sm font-black text-white">{paymentError}</p> : null}

            <div className="space-y-3.5 sm:space-y-4">
              <input className={checkoutFieldClass} name="name" placeholder={t.name} value={customer.name} onChange={(event) => updateCustomer("name", event.target.value)} required />
              <input className={checkoutFieldClass} name="phone" inputMode="tel" placeholder={t.phone} value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} required />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={checkoutLabelClass}>{t.deliveryDate}</span>
                  <input className={checkoutFieldClass} type="date" name="deliveryDate" min={minDeliveryDate} value={customer.deliveryDate} onChange={(event) => updateCustomer("deliveryDate", event.target.value)} required dir="rtl" aria-label={t.deliveryDate} />
                  <span className={checkoutHelpClass}>{t.chooseDeliveryDate}</span>
                </label>
                <label className="block">
                  <span className={checkoutLabelClass}>{t.deliveryTime}</span>
                  <input className={checkoutFieldClass} type="time" name="deliveryTime" value={customer.deliveryTime} onChange={(event) => updateCustomer("deliveryTime", event.target.value)} required dir="rtl" aria-label={t.deliveryTime} />
                  <span className={checkoutHelpClass}>{t.chooseDeliveryTime}</span>
                </label>
              </div>
              <textarea className={`${checkoutFieldClass} min-h-24`} name="address" placeholder={t.address} value={customer.address} onChange={(event) => updateCustomer("address", event.target.value)} required />
              <button className="min-h-12 w-full rounded-xl border-2 border-[#c92216] bg-white px-4 py-3 text-sm font-black uppercase text-[#c92216] shadow-lg shadow-[#f25a1d]/10 transition hover:-translate-y-0.5 hover:bg-[#ffb000]/20 active:scale-[0.98]" type="button" onClick={useCurrentLocation}>
                {t.locationButton}
              </button>
              {locationStatus ? (
                <p className={`break-words rounded-xl px-3 py-2 text-sm font-black transition ${locationSuccess ? "animate-[pulse_0.9s_ease-out_1] bg-[#ffb000]/30 text-[#351207] ring-1 ring-[#f25a1d]/30" : "text-[#c92216]"}`}>
                  {locationStatus}
                </p>
              ) : null}
              <input className={checkoutFieldClass} name="locationLink" placeholder={t.locationField} value={customer.locationLink} readOnly aria-label={t.locationField} />
              <textarea className={`${checkoutFieldClass} min-h-24`} name="notes" placeholder={t.notes} value={customer.notes} onChange={(event) => updateCustomer("notes", event.target.value)} />
            </div>
            <button className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#c92216] via-[#f25a1d] to-[#ffb000] px-4 py-3 text-sm font-black uppercase text-white shadow-xl shadow-[#f25a1d]/25 transition hover:-translate-y-0.5 hover:shadow-[#f25a1d]/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70" type="button" onClick={payNow} disabled={!cart.length || paymentPending}>
              {paymentPending ? t.paymentCreating : t.payNow}
            </button>
            <p className="mt-2 text-center text-xs font-bold text-[#8a3a18]">{t.paymentMethods}</p>
            <button className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-[#c92216] bg-white px-4 py-3 text-sm font-black uppercase text-[#c92216] shadow-lg shadow-[#f25a1d]/10 transition hover:-translate-y-0.5 hover:bg-[#ffb000]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70" type="button" onClick={sendViaWhatsapp} disabled={!cart.length || isPending}>
              {isPending ? t.savingOrder : t.sendWhatsapp}
            </button>
          </aside>
        </div>
      </section>

      <a className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#25d366] text-sm font-black text-white shadow-2xl shadow-black/20 transition hover:-translate-y-1 sm:left-6" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp">
        WA
      </a>
    </main>
  );
}
