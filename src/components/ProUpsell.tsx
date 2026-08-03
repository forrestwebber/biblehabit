"use client";

/**
 * The BibleHabit Pro upgrade surface. Replaced TrialWall on 2026-08-03.
 *
 * WHAT CHANGED AND WHY: TrialWall was a wall — day 8 ended the product and this
 * component announced it ("Your 7 days are up"). There is no wall any more. The
 * fixed read-the-Bible-in-a-year plan is free forever, so this is an upsell for
 * *control* over the habit (choose the plan, set the pace, side plans, and the
 * features coming later), never a notice that someone lost access. The copy must
 * never imply the reader is shut out, because they aren't.
 *
 * Two hard rules live in this file:
 *
 *  1. THE FREE PRODUCT IS NEVER BEHIND IT. Every placement links back to
 *     today's reading, which keeps working forever — not "scripture stays
 *     readable" as a consolation, but the whole daily habit.
 *
 *  2. NO LINKS OUT TO WEB CHECKOUT FROM THE NATIVE SHELL (App Store guideline
 *     3.1.1). Prices themselves are fine — Apple *requires* the plan name,
 *     duration and price to be shown before purchase, and the App Review
 *     screenshot has to prove it. What is forbidden is sending the user to
 *     Stripe. So native shows the real IAP prices and buys through StoreKit;
 *     web keeps Stripe.
 *
 * Numbers shown are the reader's real totals, passed in by the caller. Nothing
 * here is illustrative or invented.
 */

import { useState } from "react";
import { authHeaders } from "@/lib/use-entitlement";

/** Web (Stripe) prices. Must match the live Stripe prices in entitlement.ts. */
const PRICES = [
  { id: "month" as const, title: "$2.99 a month", sub: "Cancel any time", badge: null as string | null },
  {
    id: "year" as const,
    title: "$19.99 a year",
    sub: "About $1.67 a month — two months free",
    badge: "BEST VALUE",
  },
];

/**
 * App Store product IDs — LOAD-BEARING. These must match App Store Connect
 * exactly or StoreKit returns an empty product list and the paywall shows
 * nothing at all. Verify with `~/bin/asc_subs.py show bh`.
 * Live as of 2026-08-03: both priced in 175 territories with a 7-day free trial.
 */
const IAP = [
  { id: "co.biblehabit.app.premium.annual", key: "year" as const, name: "Annual", price: "$19.99", per: "/yr", note: "Two months free vs monthly", badge: "BEST VALUE" },
  { id: "co.biblehabit.app.premium.monthly", key: "month" as const, name: "Monthly", price: "$2.99", per: "/mo", note: "Cancel anytime", badge: null as string | null },
];

const PRO_FEATURES = [
  "Choose any reading plan — or build your own",
  "Set your own pace and start date",
  "Side plans: a daily Psalm, Proverb or Gospel",
  "Progress charts and reading history",
  "Every new feature as it ships",
];

const SunriseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" />
    <path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 6 4-4 4 4" />
    <path d="M16 18a4 4 0 0 0-8 0" />
  </svg>
);

export interface ProUpsellProps {
  /** Real current streak, in mornings. */
  streak: number;
  /** Real chapters marked complete. */
  chapters: number;
  /** True inside the Capacitor shell — StoreKit instead of Stripe. */
  isNative: boolean;
  /** Whether the reader has an account (changes the native call to action). */
  signedIn: boolean;
  /** 'full' takes the screen; 'inline' sits in a page as one card. */
  variant?: "full" | "inline";
  /** Re-checks entitlement — used after subscribing in another tab. */
  onRefresh?: () => void;
  /** Copy override for inline placements, e.g. on the Today screen. */
  inlineHeading?: string;
}

export default function ProUpsell({
  streak,
  chapters,
  isNative,
  signedIn,
  variant = "full",
  onRefresh,
  inlineHeading,
}: ProUpsellProps) {
  const [choice, setChoice] = useState<"month" | "year">("year");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const hasHistory = chapters > 0 || streak > 0;

  const handleCheckout = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ plan: choice }),
      });
      if (!res.ok) throw new Error("checkout failed");
      const { url } = await res.json();
      if (url) window.location.href = url;
      else throw new Error("no url");
    } catch {
      setError("Something went wrong starting checkout. Please try again.");
      setBusy(false);
    }
  };

  /** StoreKit purchase/restore placeholder — an honest inline notice, never a
   *  native dialog (house rule: no confirm()/alert()/prompt(), anywhere). */
  const storeKitStub = (what: string) =>
    setNotice(
      `${what} will be handled through your Apple ID — in-app purchase arrives in the next app update. ` +
        `You can subscribe on biblehabit.co today and sign in here.`
    );

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await Promise.resolve(onRefresh());
    setTimeout(() => setRefreshing(false), 600);
  };

  // ─── What they built — real numbers only ───────────────────────
  const stats = hasHistory && (
    <div className="grid grid-cols-2 gap-3" style={{ marginTop: 20 }}>
      <div className="text-center" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", borderRadius: 14, padding: "16px 12px" }}>
        <p className="bh-serif" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1 }}>{chapters}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
          chapter{chapters === 1 ? "" : "s"} read
        </p>
      </div>
      <div className="text-center" style={{ background: "var(--surface-card)", border: "1px solid var(--line-hairline)", borderRadius: 14, padding: "16px 12px" }}>
        <p className="bh-serif" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1 }}>{streak}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
          morning{streak === 1 ? "" : "s"} in a row
        </p>
      </div>
    </div>
  );

  const featureList = (
    <ul style={{ listStyle: "none", margin: "18px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      {PRO_FEATURES.map((f) => (
        <li key={f} style={{ display: "flex", gap: 9, fontSize: 14, lineHeight: 1.45, color: "var(--text-secondary)" }}>
          <span aria-hidden style={{ color: "var(--gold-500)", fontSize: 11, lineHeight: "20px" }}>◆</span>
          {f}
        </li>
      ))}
    </ul>
  );

  const freeTierReassurance = (
    <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)", marginTop: 14 }}>
      Your Bible in a Year plan, today&apos;s reading and your streak stay free — always.
    </p>
  );

  // ─── Native: real IAP prices, StoreKit only, no link to Stripe ──
  if (isNative) {
    const nativeBody = (
      <>
        <span className="bh-chip" style={{ marginBottom: 12 }}>
          <SunriseIcon size={15} /> 7-day free trial
        </span>
        <h1 className="bh-serif" style={{ fontSize: variant === "full" ? 30 : 24, fontWeight: 500, lineHeight: 1.2 }}>
          {variant === "inline" && inlineHeading ? inlineHeading : "BibleHabit Pro"}
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-secondary)", marginTop: 10 }}>
          Read the Bible your way — any plan, any pace. Free for 7 days, cancel anytime.
        </p>
        {stats}

        <div className="space-y-3" style={{ marginTop: 20 }}>
          {IAP.map((p) => {
            const selected = choice === p.key;
            return (
              <button
                key={p.id}
                onClick={() => setChoice(p.key)}
                className="w-full text-left"
                style={{
                  border: `1.5px solid ${selected ? "var(--gold-500)" : "var(--line-hairline)"}`,
                  background: selected ? "var(--gold-100)" : "var(--surface-card)",
                  borderRadius: 14,
                  padding: 16,
                  transition: "border-color 200ms, background 200ms",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="bh-serif" style={{ fontSize: 19, fontWeight: 500 }}>
                      {p.name} — {p.price}
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{p.per}</span>
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{p.note}</p>
                  </div>
                  <span
                    className="flex-shrink-0"
                    style={{
                      width: 22, height: 22, borderRadius: 999,
                      border: selected ? "6px solid var(--gold-500)" : "1.5px solid var(--line-strong)",
                      background: "var(--cream-50)",
                      transition: "border 200ms",
                    }}
                  />
                </div>
                {p.badge && (
                  <span className="bh-eyebrow inline-block" style={{ background: "var(--gold-500)", color: "var(--text-on-accent)", borderRadius: 999, padding: "5px 10px", marginTop: 10 }}>
                    {p.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {featureList}

        {notice && (
          <div style={{ background: "var(--gold-100)", border: "1px solid var(--gold-200)", borderRadius: 12, padding: "12px 13px", marginTop: 16, fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            {notice}
          </div>
        )}

        <button onClick={() => storeKitStub("Your subscription")} className="bh-btn bh-btn-primary" style={{ marginTop: 16 }}>
          Start free trial
        </button>

        <div className="space-y-2" style={{ marginTop: 4 }}>
          <button onClick={() => storeKitStub("Restoring purchases")} className="bh-btn bh-btn-quiet">
            Restore purchases
          </button>
          {!signedIn ? (
            <a href="/login?mode=signin" className="bh-btn bh-btn-quiet" style={{ textDecoration: "none" }}>
              Already subscribed? Sign in
            </a>
          ) : onRefresh ? (
            <button onClick={handleRefresh} disabled={refreshing} className="bh-btn bh-btn-quiet">
              {refreshing ? "Checking…" : "Check my subscription again"}
            </button>
          ) : null}
          <a href="/today" className="bh-btn bh-btn-quiet" style={{ textDecoration: "none" }}>
            Keep reading free
          </a>
        </div>

        {/* Apple requires the auto-renew terms next to the purchase control. */}
        <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-muted)", marginTop: 14 }}>
          7 days free, then {choice === "year" ? "$19.99 a year" : "$2.99 a month"}. Billed through your
          Apple ID and renews automatically unless cancelled at least 24 hours before the period ends.
          Manage or cancel in your Apple ID settings.{" "}
          <a href="/terms" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>Terms</a>
          {" · "}
          <a href="/privacy" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>Privacy</a>
        </p>
        {freeTierReassurance}
      </>
    );

    return variant === "full" ? <FullShell>{nativeBody}</FullShell> : <InlineShell>{nativeBody}</InlineShell>;
  }

  // ─── Web: this is where Stripe money happens ───────────────────
  const webBody = (
    <>
      <span className="bh-chip" style={{ marginBottom: 12 }}>
        <SunriseIcon size={15} /> 7-day free trial
      </span>
      <h1 className="bh-serif" style={{ fontSize: variant === "full" ? 30 : 24, fontWeight: 500, lineHeight: 1.2 }}>
        {variant === "inline" && inlineHeading ? inlineHeading : "BibleHabit Pro"}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-secondary)", marginTop: 10 }}>
        {hasHistory
          ? "Here's what you've built. Pro lets you read the Bible your way — any plan, any pace."
          : "Read the Bible your way — any plan, any pace, plus everything we add next."}
      </p>

      {stats}

      <div className="space-y-3" style={{ marginTop: 20 }}>
        {PRICES.map((p) => {
          const selected = choice === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setChoice(p.id)}
              className="w-full text-left"
              style={{
                border: `1.5px solid ${selected ? "var(--gold-500)" : "var(--line-hairline)"}`,
                background: selected ? "var(--gold-100)" : "var(--surface-card)",
                borderRadius: 14,
                padding: 16,
                transition: "border-color 200ms, background 200ms",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="bh-serif" style={{ fontSize: 19, fontWeight: 500 }}>{p.title}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{p.sub}</p>
                </div>
                <span
                  className="flex-shrink-0"
                  style={{
                    width: 22, height: 22, borderRadius: 999,
                    border: selected ? "6px solid var(--gold-500)" : "1.5px solid var(--line-strong)",
                    background: "var(--cream-50)",
                    transition: "border 200ms",
                  }}
                />
              </div>
              {p.badge && (
                <span className="bh-eyebrow inline-block" style={{ background: "var(--gold-500)", color: "var(--text-on-accent)", borderRadius: 999, padding: "5px 10px", marginTop: 10 }}>
                  {p.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {featureList}

      {error && <p style={{ fontSize: 13, color: "var(--clay-500)", marginTop: 10 }}>{error}</p>}

      <button onClick={handleCheckout} disabled={busy} className="bh-btn bh-btn-primary" style={{ marginTop: 16 }}>
        {busy ? "One moment…" : "Start my 7 free days"}
      </button>

      <a href="/today" className="bh-btn bh-btn-quiet" style={{ textDecoration: "none", marginTop: 4 }}>
        Keep reading free
      </a>

      <p className="text-center" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>
        {onRefresh && (
          <>
            <button onClick={handleRefresh} style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
              {refreshing ? "Checking…" : "Already subscribed?"}
            </button>
            {" · "}
          </>
        )}
        <a href="/terms" style={{ color: "inherit" }}>Terms</a>
      </p>
      {freeTierReassurance}
    </>
  );

  return variant === "full" ? <FullShell>{webBody}</FullShell> : <InlineShell>{webBody}</InlineShell>;
}

function FullShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ padding: "8px 0 28px" }}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: 240, background: "radial-gradient(60% 100% at 50% 0%, rgba(221,178,90,.30), transparent 70%)" }}
      />
      <div className="relative mx-auto w-full max-w-md" style={{ padding: "24px 24px 0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-mark.svg" alt="" width={44} height={44} style={{ marginBottom: 14 }} />
        {children}
      </div>
    </div>
  );
}

function InlineShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 20,
        border: "1px solid var(--gold-200)",
        background: "linear-gradient(180deg, var(--gold-100) 0%, var(--cream-50) 58%)",
        padding: 24,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{ height: "45%", background: "radial-gradient(60% 100% at 50% 100%, rgba(201,150,46,.20), transparent 70%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
