"use client";

/**
 * The wall that goes up when a 7-day trial has ended with no subscription.
 *
 * Two hard rules live in this file:
 *
 *  1. SCRIPTURE IS NEVER BEHIND IT. Every wall links back to today's reading,
 *     which stays open and free. What's gated is the habit product —
 *     streaks, pacing, plans, Progress, notes.
 *
 *  2. NATIVE SHELL SHOWS NO COMMERCE (App Store guideline 3.1.1). Inside
 *     Capacitor there are no prices, no Stripe, no checkout button and no
 *     links out to the web. Just: the trial ended, subscriptions are coming
 *     to the App Store, sign in if you already subscribed on the web.
 *
 * Numbers shown are the reader's real totals, passed in by the caller. Nothing
 * here is illustrative or invented.
 */

import { useState } from "react";
import { authHeaders } from "@/lib/use-entitlement";

const PRICES = [
  { id: "month" as const, title: "$2.99 a month", sub: "Cancel any time", badge: null as string | null },
  {
    id: "year" as const,
    title: "$19.99 a year",
    sub: "Was $24.99 · about $1.67 a month",
    badge: "LAUNCH OFFER",
  },
];

const SunriseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" />
    <path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 6 4-4 4 4" />
    <path d="M16 18a4 4 0 0 0-8 0" />
  </svg>
);

export interface TrialWallProps {
  /** Real current streak, in mornings. */
  streak: number;
  /** Real chapters marked complete. */
  chapters: number;
  /** True inside the Capacitor shell — suppresses all commerce. */
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

export default function TrialWall({
  streak,
  chapters,
  isNative,
  signedIn,
  variant = "full",
  onRefresh,
  inlineHeading,
}: TrialWallProps) {
  const [choice, setChoice] = useState<"month" | "year">("year");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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

  // ─── Native: no prices, no checkout, no links out ──────────────
  if (isNative) {
    const nativeBody = (
      <>
        <h1 className="bh-serif" style={{ fontSize: variant === "full" ? 30 : 24, fontWeight: 500, lineHeight: 1.2 }}>
          Your trial has ended
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-secondary)", marginTop: 10 }}>
          Subscriptions are coming to the App Store. If you already subscribed on the web,
          sign in to continue.
        </p>
        {stats}
        <div className="space-y-2" style={{ marginTop: 20 }}>
          {!signedIn ? (
            <a href="/login?mode=signin" className="bh-btn bh-btn-primary" style={{ textDecoration: "none" }}>
              Sign in to continue
            </a>
          ) : onRefresh ? (
            <button onClick={handleRefresh} disabled={refreshing} className="bh-btn bh-btn-secondary">
              {refreshing ? "Checking…" : "Check my subscription again"}
            </button>
          ) : null}
          <a href="/today" className="bh-btn bh-btn-quiet" style={{ textDecoration: "none" }}>
            Read today&apos;s chapter
          </a>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)", marginTop: 14 }}>
          Today&apos;s reading stays open, and everything you&apos;ve read is kept.
        </p>
      </>
    );

    return variant === "full" ? <FullShell>{nativeBody}</FullShell> : <InlineShell>{nativeBody}</InlineShell>;
  }

  // ─── Web: this is where money happens ─────────────────────────
  const webBody = (
    <>
      <span className="bh-chip" style={{ marginBottom: 12 }}>
        <SunriseIcon size={15} /> 7-day trial used
      </span>
      <h1 className="bh-serif" style={{ fontSize: variant === "full" ? 30 : 24, fontWeight: 500, lineHeight: 1.2 }}>
        {variant === "inline" && inlineHeading ? inlineHeading : "Your 7 days are up"}
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-secondary)", marginTop: 10 }}>
        {hasHistory
          ? "Here's what you built in a week. Plus keeps the streak, the pacing and the plan going."
          : "Plus keeps the streak, the pacing engine and your plan going. Scripture itself stays free."}
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

      {error && <p style={{ fontSize: 13, color: "var(--clay-500)", marginTop: 10 }}>{error}</p>}

      <button onClick={handleCheckout} disabled={busy} className="bh-btn bh-btn-primary" style={{ marginTop: 16 }}>
        {busy ? "One moment…" : choice === "year" ? "Continue — $19.99 a year" : "Continue — $2.99 a month"}
      </button>

      <a href="/today" className="bh-btn bh-btn-quiet" style={{ textDecoration: "none", marginTop: 4 }}>
        Read today&apos;s chapter — always free
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
