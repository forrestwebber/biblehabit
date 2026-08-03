"use client";

/**
 * Client-side entitlement — for deciding what the UI shows, and nothing else.
 *
 * For a signed-in reader this is a thin cache over GET /api/entitlement, which
 * resolves the verdict server-side from a verified access token. Editing the
 * value in devtools changes the pixels and nothing else: every write is gated
 * again in the API routes and in Postgres RLS (bh_is_entitled).
 *
 * For a signed-out visitor there is no server record to consult, so the 7 days
 * are anchored locally from first use. Clearing that anchor also clears the
 * local reading log it is stored beside, so it buys nothing.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type EntitlementStatus = "trialing" | "active" | "expired";
export type Tier = "free" | "pro";

export interface ClientEntitlement {
  status: EntitlementStatus;
  /** The permission. "free" = fixed year plan only; "pro" = everything. */
  tier: Tier;
  daysLeft: number;
  isPaid: boolean;
  comped: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  interval: "month" | "year" | null;
  authenticated: boolean;
  /** True when the verdict came from the local anchor, not the server. */
  local: boolean;
}

export const TRIAL_DAYS = 7;
const LOCAL_TRIAL_KEY = "bh-trial-started";
const CACHE_KEY = "bh-entitlement-cache";
const CACHE_TTL_MS = 60_000;

export function isNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

function localTrialStart(): Date {
  const existing = localStorage.getItem(LOCAL_TRIAL_KEY);
  if (existing) {
    const d = new Date(existing);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const now = new Date();
  localStorage.setItem(LOCAL_TRIAL_KEY, now.toISOString());
  return now;
}

function daysUntil(to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - Date.now()) / 86_400_000));
}

function anonymousEntitlement(): ClientEntitlement {
  const start = localTrialStart();
  const ends = new Date(start.getTime() + TRIAL_DAYS * 86_400_000);
  const left = daysUntil(ends);
  return {
    status: left > 0 ? "trialing" : "expired",
    tier: left > 0 ? "pro" : "free",
    daysLeft: left,
    isPaid: false,
    comped: false,
    trialEndsAt: ends.toISOString(),
    currentPeriodEnd: null,
    interval: null,
    authenticated: false,
    local: true,
  };
}

function readCache(userId: string): ClientEntitlement | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId: string; expires: number; ent: ClientEntitlement };
    if (parsed.userId !== userId || parsed.expires < Date.now()) return null;
    return parsed.ent;
  } catch {
    return null;
  }
}

function writeCache(userId: string, ent: ClientEntitlement) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ userId, expires: Date.now() + CACHE_TTL_MS, ent })
    );
  } catch {
    /* private mode — just skip the cache */
  }
}

export function clearEntitlementCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export interface UseEntitlement {
  ent: ClientEntitlement | null;
  loading: boolean;
  /**
   * Has Pro — may customize the plan, change pace, use side plans, and every
   * paid feature we add later. This replaced `locked` on 2026-08-03: there is
   * no wall any more, so the question is never "are they shut out?" but
   * "do they have the paid tier?".
   */
  pro: boolean;
  isNative: boolean;
  refresh: () => Promise<void>;
}

type SessionLike = { user?: { id?: string } | null; access_token?: string } | null;

export function useEntitlement(): UseEntitlement {
  const [ent, setEnt] = useState<ClientEntitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNative, setIsNative] = useState(false);

  const apply = useCallback(async (session: SessionLike, fresh = false) => {
    if (!session?.user?.id || !session.access_token) {
      setEnt(anonymousEntitlement());
      setLoading(false);
      return;
    }

    const userId: string = session.user.id;
    if (!fresh) {
      const cached = readCache(userId);
      if (cached) {
        setEnt(cached);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/entitlement${fresh ? "?fresh=1" : ""}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`entitlement ${res.status}`);
      const json = await res.json();

      const resolved: ClientEntitlement = {
        status: (json.status as EntitlementStatus) ?? "expired",
        // Default to "free", never "pro": if the server ever stops sending a
        // tier, the safe read is the free product, not a giveaway of Pro.
        tier: json.tier === "pro" ? "pro" : "free",
        daysLeft: json.daysLeft ?? 0,
        isPaid: !!json.isPaid,
        comped: !!json.comped,
        trialEndsAt: json.trialEndsAt ?? null,
        currentPeriodEnd: json.currentPeriodEnd ?? null,
        interval: json.interval ?? null,
        authenticated: !!json.authenticated,
        local: false,
      };
      setEnt(resolved);
      writeCache(userId, resolved);
    } catch (e) {
      // Never wall somebody because a network hiccup ate the answer. Pro is the
      // lenient fallback here on purpose: this is UI-only, and every write is
      // re-gated server-side, so the worst case is a Pro control that returns
      // 402 when tapped — far better than falsely telling a paying subscriber
      // they are on the free tier.
      console.error("[entitlement] lookup failed, allowing this session:", e);
      setEnt({
        status: "active",
        tier: "pro",
        daysLeft: 0,
        isPaid: false,
        comped: false,
        trialEndsAt: null,
        currentPeriodEnd: null,
        interval: null,
        authenticated: true,
        local: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /** Reads the current session, then resolves entitlement from it. */
  const load = useCallback(
    async (fresh = false) => {
      const { data } = await supabase.auth.getSession();
      await apply(data.session as SessionLike, fresh);
    },
    [apply]
  );

  useEffect(() => {
    setIsNative(isNativeShell());
    let cancelled = false;
    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // IMPORTANT: never call supabase.auth.* (getSession/getUser) inside this
      // callback. supabase-js runs it while holding its auth lock, so a nested
      // auth call deadlocks the whole client — no session ever resolves and the
      // page silently stops talking to Supabase. Use the session handed to us,
      // and defer the work off the callback stack.
      if (event === "INITIAL_SESSION") return; // the load() above covers this
      clearEntitlementCache();
      setTimeout(() => {
        if (!cancelled) apply(session as SessionLike, true);
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [load, apply]);

  const refresh = useCallback(async () => {
    clearEntitlementCache();
    setLoading(true);
    await load(true);
  }, [load]);

  return {
    ent,
    loading,
    // While loading, assume Pro so paid subscribers never see a flash of
    // upgrade prompts on every page load. Nothing is granted by being
    // optimistic here — the server re-checks every write.
    pro: loading || ent?.tier !== "free",
    isNative,
    refresh,
  };
}

/** Bearer header for gated API calls. Returns {} when signed out. */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
