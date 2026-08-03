"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProUpsell from "@/components/ProUpsell";
import { getCurrentStreak, getTotalChaptersRead } from "@/lib/reading-store";

const FEATURES = [
  {
    title: "Any plan, any pace",
    desc: "Choose a plan or build your own, then set the pace — a minute a day or an hour.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 6 4-4 4 4" /><path d="M16 18a4 4 0 0 0-8 0" /></svg>
    ),
  },
  {
    title: "More than one thing at a time",
    desc: "A long plan and a daily habit, side by side.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
    ),
  },
  {
    title: "Streak insurance",
    desc: "Two rest days a month that leave your count alone.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
    ),
  },
  {
    title: "One note, your hour",
    desc: "Never a catch-up, never a countdown.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
    ),
  },
];

export default function PlusPage() {
  const [choice, setChoice] = useState<"month" | "year">("year");
  const [isNative, setIsNative] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsNative(
      typeof (window as any).Capacitor !== "undefined" &&
      !!(window as any).Capacitor.isNativePlatform?.()
    );
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? undefined);
    });
  }, []);

  const handleCheckout = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: choice, email }),
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

  const ctaLabel = choice === "year"
    ? "Start 7 days free, then $19.99 a year"
    : "Start 7 days free, then $2.99 a month";

  return (
    <div className="bh-app relative flex flex-col" style={{ minHeight: "calc(100vh - var(--bh-banner-h, 0px))" }}>
      {/* Dawn wash at the top */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: 260, background: "radial-gradient(60% 100% at 50% 0%, rgba(221,178,90,.30), transparent 70%)" }} />

      {/* Close */}
      <div className="relative flex justify-end mx-auto w-full max-w-md" style={{ padding: "18px 24px 0" }}>
        <button
          onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = "/today"))}
          aria-label="Close"
          className="flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 999, background: "var(--surface-sunk)", color: "var(--text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </div>

      <div className="relative flex-1 mx-auto w-full max-w-md" style={{ padding: "8px 24px 16px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-mark.svg" alt="" width={44} height={44} />
        <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2, marginTop: 14 }}>BibleHabit Pro</h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text-secondary)", marginTop: 6 }}>
          Bible in a Year is free forever. Pro is for reading it your way.
        </p>

        {/* Features */}
        <div className="space-y-4" style={{ marginTop: 24 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span style={{ color: "var(--gold-500)", marginTop: 2, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{f.title}</p>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)", marginTop: 1 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {isNative === false && (
          /* Prices — web only */
          <div className="space-y-3" style={{ marginTop: 28 }}>
            {([
              { id: "month" as const, title: "$2.99 a month", sub: "Cancel any time", badge: null },
              { id: "year" as const, title: "$19.99 a year", sub: "About $1.67 a month — two months free", badge: "BEST VALUE" },
            ]).map((p) => {
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
                      className="flex items-center justify-center flex-shrink-0"
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
            {error && (
              <p style={{ fontSize: 13, color: "var(--clay-500)" }}>{error}</p>
            )}
          </div>
        )}

        {isNative === true && (
          /* Native: the real IAP offer. This used to say "Plus is coming to the
             App Store" and show no prices — stale (both subscriptions are live
             in App Store Connect) and unusable as the App Review screenshot,
             which has to show the plan name, duration and price. ProUpsell owns
             that surface for every screen, so it owns this one too. */
          <div style={{ marginTop: 20 }}>
            <ProUpsell
              variant="inline"
              isNative
              signedIn={!!email}
              streak={getCurrentStreak()}
              chapters={getTotalChaptersRead()}
            />
          </div>
        )}
      </div>

      {/* Footer — above a hairline, clear of the home indicator */}
      {isNative === false && (
        <div className="relative mx-auto w-full max-w-md" style={{ borderTop: "1px solid var(--line-hairline)", padding: "14px 24px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
          <button onClick={handleCheckout} disabled={busy} className="bh-btn bh-btn-primary">
            {busy ? "One moment…" : ctaLabel}
          </button>
          <p className="text-center" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>
            <a href="/profile" style={{ color: "inherit" }}>Restore purchases</a>
            {" · "}
            <a href="/terms" style={{ color: "inherit" }}>Terms</a>
          </p>
        </div>
      )}
    </div>
  );
}
