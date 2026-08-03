"use client";

/**
 * In-trial affordance: one quiet line, once a day, dismissible.
 *
 * Deliberately not a nag — no interstitial, no countdown clock, no
 * "hurry", no blocking. It states the fact and gets out of the way, and
 * once dismissed it stays gone for the rest of the day.
 *
 * In the native shell it carries no link and no price (App Store 3.1.1) —
 * just the days remaining.
 */

import { useState, useEffect } from "react";

function todayKey(): string {
  const d = new Date();
  return `bh-trial-banner-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TrialBanner({
  daysLeft,
  isNative,
}: {
  daysLeft: number;
  isNative: boolean;
}) {
  const [visible, setVisible] = useState(false);

  // Decided on the client only: localStorage doesn't exist during SSR, and
  // rendering the banner in the server markup would cause a hydration
  // mismatch. Same pattern the tab bar and App Store banner already use.
  useEffect(() => {
    if (daysLeft <= 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount read of a dismissal flag
    setVisible(localStorage.getItem(todayKey()) !== "1");
  }, [daysLeft]);

  if (!visible || daysLeft <= 0) return null;

  const dismiss = () => {
    localStorage.setItem(todayKey(), "1");
    setVisible(false);
  };

  return (
    <div
      className="bh-fade flex items-center gap-3"
      style={{
        background: "var(--surface-sunk)",
        borderRadius: 12,
        padding: "10px 12px 10px 14px",
        marginBottom: 16,
      }}
    >
      <p className="flex-1" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        <span style={{ fontWeight: 600, color: "var(--text-accent)" }}>Trial</span>
        {" · "}
        {daysLeft === 1 ? "last day" : `${daysLeft} days left`}
        {!isNative && (
          <>
            {" · "}
            <a href="/plus" style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 3 }}>
              see Pro
            </a>
          </>
        )}
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 26, height: 26, borderRadius: 999, color: "var(--text-muted)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>
    </div>
  );
}

/** Settings-row version: always visible, never dismissible, no CTA. */
export function TrialRow({ daysLeft, ended }: { daysLeft: number; ended: boolean }) {
  return (
    <span
      style={{
        background: ended ? "var(--cream-200)" : "var(--gold-100)",
        color: ended ? "var(--text-muted)" : "var(--gold-700)",
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 999,
        padding: "4px 12px",
        whiteSpace: "nowrap",
      }}
    >
      {/* "Trial ended" implied a lockout that no longer exists — after the
          trial the account simply sits on the free plan. */}
      {ended ? "Free plan" : daysLeft === 1 ? "Trial · last day" : `Trial · ${daysLeft} days left`}
    </span>
  );
}
