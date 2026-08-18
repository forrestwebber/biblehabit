"use client";
import { useEffect, useState } from "react";

/**
 * Is this page running inside the native iOS app (Capacitor WebView) rather than
 * a normal browser?
 *
 * WHY THIS EXISTS — App Store Guideline 3.1.1. BibleHabit Plus is sold through
 * Stripe Checkout, which is fine on the web but is NOT allowed as a purchase
 * mechanism inside an iOS app: digital subscriptions consumed in the app must go
 * through Apple's in-app purchase. The app is a WebView pointed at biblehabit.co,
 * so without this check the reviewer taps "Upgrade" and lands on Stripe.
 *
 * Until real StoreKit IAP ships, the app hides every purchase surface: no prices,
 * no upgrade buttons, and no links pointing at a place to buy (3.1.1 also covers
 * steering users out to an external purchase, so we don't link out either).
 *
 * Returns null until the check has run. Callers should treat null as "assume
 * native and hide", so a purchase CTA can never flash on screen inside the app
 * during hydration — being briefly conservative on the web is much cheaper than
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

/** True only once we've confirmed we are NOT in the native app. */
export function useShowPurchaseUI(): boolean {
  return useIsNativeApp() === false;
}
