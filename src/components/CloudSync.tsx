"use client";

/**
 * Restores a signed-in reader's notes, highlights, sub-plans, XP and
 * preferences onto whatever device they are holding.
 *
 * Mounted once in the root layout so it runs on every route, including a cold
 * app launch. Order matters:
 *   1. pushUnsynced() — anything created before this device ever synced (e.g.
 *      notes written while signed out, then an account created) goes up first,
 *      so signing in never costs a reader work.
 *   2. pullAll() — bring down anything newer from the cloud.
 * Then a storage event tells the mounted stores to re-read localStorage.
 */

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { pullAll, pushUnsynced } from "@/lib/cloud-state";

export default function CloudSync() {
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        await pushUnsynced();
        const restored = await pullAll();
        if (!cancelled && restored > 0) {
          // Nudge any store reading from localStorage to pick up the new values.
          window.dispatchEvent(new Event("biblehabit:state-restored"));
        }
      } catch (e) {
        console.error("[CloudSync]", e);
      }
    }

    void sync();

    // Re-sync when the session appears (sign-in) — but never call a supabase
    // auth method inside this callback: supabase-js holds its auth lock during
    // the event and awaiting getSession() there deadlocks. Defer to a task.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setTimeout(() => { void sync(); }, 0);
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
