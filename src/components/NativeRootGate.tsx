"use client";

/**
 * Native app entry router.
 *
 * The Capacitor shell loads https://biblehabit.co with no path, so every cold
 * launch landed on the MARKETING homepage — purple (pre-redesign) brand, a
 * decorative "pick up where you are" calculator whose chapter dropdown only
 * offered Ch. 1/2/3/5/10/15/20/25, and hardcoded projections. It rendered
 * under the app's own tab bar, which highlighted "Today" (see MobileTabBar's
 * `pathname === "/"` case) and made a marketing page look like an app screen.
 * Forrest hit exactly this on 2026-08-02 ("I'm on chapter 45 and I can't
 * select that ... is this page null? The new design is more beige bg").
 *
 * In the shell, "/" is not a page — it's a router: signed in → /today,
 * otherwise → /login. A cream cover paints over the marketing markup for the
 * one beat before navigation so the purple never flashes. On the web, "/" is
 * still the marketing homepage and this component renders nothing.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";

export default function NativeRootGate() {
  const pathname = usePathname();
  const [covering, setCovering] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (pathname !== "/") return;

    setCovering(true);
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        window.location.replace(data.session?.user ? "/today" : "/login");
      })
      .catch(() => {
        if (!cancelled) window.location.replace("/login");
      });

    return () => { cancelled = true };
  }, [pathname]);

  if (!covering) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--cream-100, #F7F2E8)",
      }}
    />
  );
}
