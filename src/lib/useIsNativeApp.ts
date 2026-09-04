"use client";
import { useEffect, useState } from "react";

/**
 * Is this page running inside the native iOS app (Capacitor WebView) rather than
 * a normal browser?
 *
 * WHY THIS EXISTS — App Store Guideline 3.1.1. On the web BibleHabit Plus is sold
 * through Stripe Checkout and managed in the Stripe Billing Portal. Neither may
 * appear inside the iOS app: digital subscriptions consumed in the app must be
 * purchasable through Apple In-App Purchase, and the app may not steer users to
 * an outside checkout. The app is a WebView pointed at biblehabit.co, so the
 * SAME pages serve both — this hook is how they tell which one they are in.
 *
 * Inside the app, /pricing renders NativePaywall (StoreKit 2, verified by
 * /api/iap/verify) and MembershipCard offers Apple's subscription settings.
 * Stripe checkout and the Stripe portal render only when useShowPurchaseUI()
 * is true, i.e. only once we have CONFIRMED we are not in the app.
 *
 * Returns null until the check has run. Callers should treat null as "assume
 * native", so a Stripe control can never flash on screen inside the app during
 * hydration — being briefly conservative on the web is much cheaper than
 * another rejection.
 */
export function useIsNativeApp(): boolean | null {
  const [isNative, setIsNative] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
      setIsNative(typeof cap !== "undefined" && cap?.isNativePlatform?.() === true);
    } catch {
      setIsNative(false);
    }
  }, []);

  return isNative;
}

/** True only once we've confirmed we are NOT in the native app — gates Stripe checkout + portal. */
export function useShowPurchaseUI(): boolean {
  return useIsNativeApp() === false;
}
