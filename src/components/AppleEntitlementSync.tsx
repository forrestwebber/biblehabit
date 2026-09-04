"use client";
import { useEffect } from "react";
import { syncAppleEntitlement } from "@/lib/storekit";

/**
 * Inside the native iOS app only: on launch, ask StoreKit for the current
 * entitlements and let /api/iap/verify mirror them into profiles.plan. Makes
 * a reinstall or a second device pick up an existing Apple subscription
 * without the user tapping Restore. Renders nothing; no-op on the web.
 */
export default function AppleEntitlementSync() {
  useEffect(() => {
    void syncAppleEntitlement();
  }, []);
  return null;
}
