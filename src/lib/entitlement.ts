/**
 * BibleHabit entitlement — the single server-side source of truth.
 *
 * THE RULES (rewritten 2026-08-03 — free tier replaces the hard trial wall):
 *   • FREE, forever, for every signed-in account: the fixed
 *     read-the-Bible-in-a-year plan. Log in daily, see today's reading, mark it
 *     done, keep a streak. No customization, and deliberately no extras — the
 *     free tier is a complete, finished product, not a crippled demo.
 *   • PRO: everything else. Choosing or building a plan, changing pace,
 *     side/devotional plans, progress analytics, and every feature we add later
 *     (memorization flashcards and so on). 7-day free trial from signup, then
 *     $2.99/mo or $19.99/yr.
 *   • A paid or comped subscription grants Pro indefinitely.
 *
 * WHY THIS REPLACED THE OLD MODEL: until today, day 8 turned the app into a
 * dead end — the habit product locked and only raw scripture stayed readable.
 * That is the worst possible outcome for a habit app, which only works if the
 * user keeps showing up. Now the habit itself is free forever and Pro sells
 * control over it, so lapsing costs us nothing and the upgrade path stays warm.
 *
 * `status` still reports trialing/active/expired because billing genuinely has
 * those three states, but "expired" now means "on the free tier" — NOT locked
 * out. Read access from `tier`, never by comparing status to a string.
 *
 * Never trust the client. Entitlement is only ever computed here, from the
 * database, for a user resolved from a verified Supabase access token. The
 * same rules are duplicated in Postgres as public.bh_is_entitled() so RLS
 * blocks Pro-only writes even if an API route were bypassed entirely.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type EntitlementStatus = "trialing" | "active" | "expired";

/** What the account can actually do. This — not `status` — is the permission. */
export type Tier = "free" | "pro";

export interface Entitlement {
  status: EntitlementStatus;
  /** The permission. "free" = fixed year plan only; "pro" = everything. */
  tier: Tier;
  /** Whole days remaining in the free trial. 0 unless status === 'trialing'. */
  daysLeft: number;
  /** True when access comes from a paid (or comped) subscription. */
  isPaid: boolean;
  comped: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  interval: "month" | "year" | null;
  cancelAtPeriodEnd: boolean;
  /** Where the verdict came from — useful in logs, never a permission input. */
  source: "trial" | "subscription" | "comped" | "none";
}

export const TRIAL_DAYS = 7;
export const SITE = "biblehabit.co";

/** The two live BibleHabit Plus prices. Used to attribute Stripe events that
 *  predate (or somehow lack) our metadata.site tag. */
export const OUR_PRICE_IDS = [
  process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || "price_1TvfndHZglL7cJQjvd4iOJFV",
  process.env.STRIPE_PLUS_ANNUAL_PRICE_ID || "price_1TvfndHZglL7cJQjWe4BsMOA",
];

const PAID_STATUSES = ["active", "trialing"];
const GRACE_STATUSES = ["past_due", "unpaid"];

/** How long a resolved entitlement is reused within one server instance. */
const CACHE_TTL_MS = 60_000;
/** How often we re-ask Stripe about an account with no known subscription. */
const STRIPE_RECHECK_MS = 6 * 60 * 60 * 1000;

const cache = new Map<string, { ent: Entitlement; expires: number }>();

export interface AuthedUser {
  id: string;
  email: string;
}

interface SubscriptionRow {
  email: string;
  status: string;
  comped: boolean;
  price_interval: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  last_checked_at: string | null;
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
}

/** Trial over, nothing paid → the free tier. Named FREE_TIER, not EXPIRED,
 *  because nothing is actually locked: the year plan keeps working forever. */
const FREE_TIER: Entitlement = {
  status: "expired",
  tier: "free",
  daysLeft: 0,
  isPaid: false,
  comped: false,
  trialEndsAt: null,
  currentPeriodEnd: null,
  interval: null,
  cancelAtPeriodEnd: false,
  source: "none",
};

/**
 * Resolve the caller from an `Authorization: Bearer <supabase access token>`
 * header. The token is verified by Supabase — a forged one resolves to null.
 */
export async function getUserFromRequest(req: NextRequest): Promise<AuthedUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user?.email) return null;
    return { id: data.user.id, email: data.user.email.toLowerCase() };
  } catch (e) {
    console.error("[entitlement] token verification failed:", e);
    return null;
  }
}

function fromSubscription(row: SubscriptionRow, trialEndsAt: string | null): Entitlement | null {
  const periodEnd = row.current_period_end ? new Date(row.current_period_end) : null;
  const interval: "month" | "year" | null =
    row.price_interval === "month" || row.price_interval === "year" ? row.price_interval : null;

  const base = {
    status: "active" as const,
    tier: "pro" as const,
    daysLeft: 0,
    isPaid: true,
    trialEndsAt,
    currentPeriodEnd: row.current_period_end,
    interval,
    cancelAtPeriodEnd: !!row.cancel_at_period_end,
  };

  if (row.comped) return { ...base, comped: true, source: "comped" };
  if (PAID_STATUSES.includes(row.status)) return { ...base, comped: false, source: "subscription" };
  // A failed payment keeps access until the period they already paid for ends.
  if (GRACE_STATUSES.includes(row.status) && periodEnd && periodEnd > new Date()) {
    return { ...base, comped: false, source: "subscription" };
  }
  return null;
}

/**
 * Ask Stripe directly, once in a while, for accounts we have no subscription
 * on file for. Covers people who paid before the webhook existed, or whose
 * checkout email differs in case/alias. The answer is persisted so the next
 * request is a plain database read.
 */
async function reconcileWithStripe(email: string): Promise<SubscriptionRow | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  const stripe = new Stripe(secretKey);
  const nowIso = new Date().toISOString();

  try {
    const customers = await stripe.customers.list({ email, limit: 5 });
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 10 });
      const live = subs.data.find((s) => {
        if (!PAID_STATUSES.includes(s.status)) return false;
        const site = s.metadata?.site;
        if (site) return site === SITE;
        // No tag (legacy) — attribute by price instead, so a HD Signals or
        // Dreams & Myths subscription can never unlock BibleHabit.
        return s.items.data.some((i) => i.price?.id && OUR_PRICE_IDS.includes(i.price.id));
      });
      if (!live) continue;

      const item = live.items.data[0];
      const row = {
        email,
        stripe_customer_id: customer.id,
        stripe_subscription_id: live.id,
        status: live.status,
        price_interval: item?.price?.recurring?.interval ?? null,
        current_period_end: item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: !!live.cancel_at_period_end,
        site: SITE,
        last_checked_at: nowIso,
        updated_at: nowIso,
      };
      await supabaseAdmin.from("subscriptions").upsert(row, { onConflict: "email" });
      return { ...row, comped: false } as SubscriptionRow;
    }

    // Nothing found — record the negative so we don't re-ask on every request.
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        { email, status: "none", site: SITE, last_checked_at: nowIso, updated_at: nowIso },
        { onConflict: "email" }
      );
    return null;
  } catch (e) {
    console.error("[entitlement] Stripe reconciliation failed:", e);
    return null;
  }
}

/**
 * Drop the in-process cache for one user. Call this right after any write
 * that changes their entitlement outside the normal Stripe-webhook path —
 * today that means /api/iap/verify — so a request landing on the SAME warm
 * server instance within the next 60s doesn't serve a pre-purchase verdict.
 * (A cold instance never had the stale entry in the first place, so this is
 * a "why not" belt-and-suspenders, not the only thing making this correct.)
 */
export function invalidateEntitlementCache(userId: string) {
  cache.delete(userId);
}

/** Resolve entitlement for a verified user. Cached briefly per instance. */
export async function getEntitlement(user: AuthedUser, opts?: { fresh?: boolean }): Promise<Entitlement> {
  const key = user.id;
  if (!opts?.fresh) {
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.ent;
  }

  const ent = await resolve(user);
  cache.set(key, { ent, expires: Date.now() + CACHE_TTL_MS });
  return ent;
}

async function resolve(user: AuthedUser): Promise<Entitlement> {
  const email = user.email.toLowerCase();

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabaseAdmin.from("profiles").select("trial_started_at, trial_ends_at").eq("id", user.id).maybeSingle(),
    supabaseAdmin
      .from("subscriptions")
      .select("email, status, comped, price_interval, current_period_end, cancel_at_period_end, last_checked_at")
      .eq("email", email)
      .maybeSingle(),
  ]);

  const trialEndsAt: string | null = profile?.trial_ends_at ?? null;

  // 1. Paid or comped wins outright.
  if (sub) {
    const paid = fromSubscription(sub as SubscriptionRow, trialEndsAt);
    if (paid) return paid;
  }

  // 2. Inside the trial window.
  const now = new Date();
  if (trialEndsAt) {
    const ends = new Date(trialEndsAt);
    if (ends > now) {
      return {
        status: "trialing",
        tier: "pro",              // the trial IS Pro — that is the whole point of it
        daysLeft: daysBetween(now, ends),
        isPaid: false,
        comped: false,
        trialEndsAt,
        currentPeriodEnd: null,
        interval: null,
        cancelAtPeriodEnd: false,
        source: "trial",
      };
    }
  }

  // 3. Trial is over and we have nothing on file (or the file is stale) —
  //    ask Stripe once, then persist, so nobody who actually paid is walled.
  const lastChecked = sub?.last_checked_at ? new Date(sub.last_checked_at).getTime() : 0;
  const stale = Date.now() - lastChecked > STRIPE_RECHECK_MS;
  if (!sub || (stale && !sub.comped && !PAID_STATUSES.includes(sub.status))) {
    const found = await reconcileWithStripe(email);
    if (found) {
      const paid = fromSubscription(found, trialEndsAt);
      if (paid) return paid;
    }
  }

  return { ...FREE_TIER, trialEndsAt };
}

/** Pro access — the gate for customization and every paid feature. */
export function isPro(ent: Entitlement): boolean {
  return ent.tier === "pro";
}

/**
 * Signed in at all. Every authenticated account clears this, including the free
 * tier, because the year plan is free forever.
 *
 * Kept as a named function rather than inlining `true` so the free tier still
 * has ONE place to gate on if it ever needs to lose access (a banned account,
 * say) — and so no caller is tempted to reach for isPro() to guard the daily
 * reading, which would put the wall back where we just removed it.
 */
export function hasHabitAccess(_ent: Entitlement): boolean {
  return true;
}

export interface GateFailure {
  response: NextResponse;
}

/**
 * Gate for routes any signed-in reader may use — the free tier included. This
 * is the right gate for the daily habit itself: today's reading, marking it
 * done, the streak.
 *
 *   const gate = await requireEntitlement(req);
 *   if ("response" in gate) return gate.response;
 *   // gate.user / gate.ent are safe to use
 */
export async function requireEntitlement(
  req: NextRequest
): Promise<{ user: AuthedUser; ent: Entitlement } | GateFailure> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Sign in required", code: "unauthenticated" },
        { status: 401 }
      ),
    };
  }
  return { user, ent: await getEntitlement(user) };
}

/**
 * Gate for PRO-ONLY routes: building or switching plans, changing pace, side
 * plans, and every paid feature we add later. Free-tier callers get a 402 with
 * `code: "pro_required"` so the client can show the upgrade screen instead of
 * an error — deliberately NOT "trial_expired", which described a wall that no
 * longer exists and would read as "you lost access" to a free-tier user.
 */
export async function requirePro(
  req: NextRequest
): Promise<{ user: AuthedUser; ent: Entitlement } | GateFailure> {
  const gate = await requireEntitlement(req);
  if ("response" in gate) return gate;

  if (!isPro(gate.ent)) {
    return {
      response: NextResponse.json(
        {
          error: "BibleHabit Pro is required to customize your plan",
          code: "pro_required",
          status: gate.ent.status,
          tier: gate.ent.tier,
          trialEndsAt: gate.ent.trialEndsAt,
        },
        { status: 402 }
      ),
    };
  }

  return gate;
}
