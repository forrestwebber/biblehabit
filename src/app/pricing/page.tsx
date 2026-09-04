"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import NavBar from "@/components/NavBar";
import { supabase } from "@/lib/supabase";
import { useShowPurchaseUI } from "@/lib/useIsNativeApp";
import NativePaywall from "@/components/NativePaywall";

const INK = "#221C14";
const SOFT_INK = "#5A4F3F";
const BODY = "#5C5142";
const META = "#8A7F6E";
const GOLD = "#C9962E";
const GOLD_HOVER = "#B5841F";
const CARD = "#FFFDF8";
const TILE = "#FBF4E4";
const PARCHMENT = "#F7F2E8";
const SERIF = "'Lora', serif";

const FREE_FEATURES = [
  "Unlimited custom reading plans",
  "Daily progress & streak tracking",
  "KJV and WEB translations",
  "Gentle reflow when you miss a day",
  "Cross-references & notes",
];

const PLUS_FEATURES = [
  "Everything in Free",
  "Pacing projections — see your finish date update live",
  "Personalized reflow suggestions when you fall behind",
  "Multiple simultaneous reading goals",
  "Streak repair — recover a broken streak once a month",
];

type Interval = "month" | "year";

function PricingContent() {
  // App Store 3.1.1 — on the web, Plus is sold through Stripe. Inside the native
  // iOS app that is not allowed, so the app renders NativePaywall instead: the same
  // two plans bought through Apple In-App Purchase (StoreKit 2), verified by
  // /api/iap/verify. Nothing in the native branch links out to Stripe.
  const searchParams = useSearchParams();
  // ?preview=native renders the In-App Purchase paywall in a normal browser so the
  // App Store review screenshot can be captured. Buttons are inert outside the app
  // ("In-app purchase is only available in the BibleHabit app").
  const showPurchaseUI = useShowPurchaseUI() && searchParams.get("preview") !== "native";
  const [plan, setPlan] = useState<"free" | "plus" | null>(null);
  const [loadingInterval, setLoadingInterval] = useState<Interval | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      setIsSignedIn(!!user);
      if (!user) return setPlan("free");
      const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      setPlan((profile?.plan as "free" | "plus") || "free");
    });
  }, []);

  const startCheckout = async (interval: Interval) => {
    setError(null);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      // Not signed in — send to signup, then bounce back here to resume checkout.
      const next = `/pricing?intent=${interval}`;
      window.location.href = `/login?mode=signup&next=${encodeURIComponent(next)}`;
      return;
    }

    setLoadingInterval(interval);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interval }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Could not start checkout");
      }
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setLoadingInterval(null);
    }
  };

  // Resume checkout automatically if the user just signed in via ?intent=
  useEffect(() => {
    if (autoTriggered || isSignedIn !== true) return;
    const intent = searchParams.get("intent");
    if (intent === "month" || intent === "year") {
      setAutoTriggered(true);
      startCheckout(intent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, autoTriggered]);

  const canceled = searchParams.get("canceled") === "1";

  if (!showPurchaseUI) {
    return (
      <div className="min-h-screen" style={{ background: PARCHMENT, color: INK }}>
        <NavBar />
        <section className="pt-14 pb-6 px-6 text-center max-w-2xl mx-auto">
          <p className="text-sm uppercase font-semibold mb-4" style={{ letterSpacing: "0.08em", color: "#8A6A1E" }}>
            Simple pricing
          </p>
          <h1 className="text-4xl font-semibold mb-4" style={{ fontFamily: SERIF, letterSpacing: "-0.01em" }}>
            Free forever. Upgrade if it helps.
          </h1>
          <p style={{ color: BODY }}>
            Every reading plan, every streak, every chapter — always free. Plus adds the pacing
            intelligence for readers who want to see the road ahead.
          </p>
        </section>
        <NativePaywall plan={plan} />
        <section className="px-6 pb-20 max-w-md mx-auto">
          <div className="rounded-2xl p-6" style={{ background: CARD, border: "1px solid rgba(34,28,20,0.10)" }}>
            <p className="text-sm font-semibold mb-3" style={{ color: INK }}>Always free</p>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-3 items-start text-sm" style={{ color: BODY }}>
                  <Check size={18} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: PARCHMENT, color: INK }}>
      <NavBar />

      <section className="pt-16 pb-8 px-6 text-center max-w-2xl mx-auto">
        <p className="text-sm uppercase font-semibold mb-4" style={{ letterSpacing: "0.08em", color: "#8A6A1E" }}>
          Simple pricing
        </p>
        <h1 className="text-4xl font-semibold mb-4" style={{ fontFamily: SERIF, letterSpacing: "-0.01em" }}>
          Free forever. Upgrade if it helps.
        </h1>
        <p style={{ color: BODY }}>
          Every reading plan, every streak, every chapter — always free. Plus adds the pacing
          intelligence for readers who want to see the road ahead.
        </p>
        {canceled && (
          <p className="text-sm mt-4 rounded-xl inline-block px-4 py-2" style={{ background: TILE, color: SOFT_INK }}>
            No charge was made — pick up whenever you&apos;re ready.
          </p>
        )}
        {error && (
          <p className="text-sm mt-4 rounded-xl inline-block px-4 py-2" style={{ background: "#FBEAEA", color: "#8A2E2E" }}>
            {error}
          </p>
        )}
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 items-start">
          {/* Free */}
          <div className="rounded-3xl p-8" style={{ background: CARD, border: "1px solid rgba(34,28,20,0.08)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
            <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: SERIF }}>Free</h2>
            <p className="text-sm mb-6" style={{ color: META }}>Everything you need to build the habit</p>
            <p className="mb-6">
              <span className="text-4xl font-bold" style={{ fontFamily: SERIF }}>$0</span>
              <span className="text-sm" style={{ color: META }}> forever</span>
            </p>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: SOFT_INK }}>
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#7A8B6F" }} />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/welcome"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition"
              style={{ background: TILE, color: INK, border: "1px solid rgba(34,28,20,0.1)" }}
            >
              Start Free
            </a>
          </div>

          {/* Plus Monthly */}
          <div
            className="rounded-3xl p-8 relative"
            style={{ background: INK, color: "#F7F2E8", boxShadow: "0 20px 50px -20px rgba(34,28,20,0.5)" }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1"
              style={{ background: GOLD, color: INK, letterSpacing: "0.04em" }}
            >
              <Sparkles className="h-3 w-3" /> Most flexible
            </div>
            <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: SERIF }}>Plus Monthly</h2>
            <p className="text-sm mb-6" style={{ color: "#C6BBA4" }}>Pacing intelligence, cancel anytime</p>
            <p className="mb-6">
              <span className="text-4xl font-bold" style={{ fontFamily: SERIF }}>$2.99</span>
              <span className="text-sm" style={{ color: "#C6BBA4" }}> / month</span>
            </p>
            <ul className="space-y-3 mb-8">
              {PLUS_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "#E7DFCB" }}>
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => startCheckout("month")}
              disabled={loadingInterval !== null}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition disabled:opacity-60"
              style={{ background: GOLD, color: INK }}
              onMouseEnter={(e) => { if (!loadingInterval) e.currentTarget.style.background = GOLD_HOVER; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
            >
              {loadingInterval === "month" ? "Redirecting…" : "Get Plus Monthly"}
            </button>
          </div>

          {/* Plus Annual */}
          <div className="rounded-3xl p-8" style={{ background: CARD, border: `2px solid ${GOLD}`, boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
            <div
              className="inline-block text-xs font-bold uppercase px-3 py-1 rounded-full mb-4"
              style={{ background: TILE, color: "#8A6A1E", letterSpacing: "0.04em" }}
            >
              Save 47%
            </div>
            <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: SERIF }}>Plus Annual</h2>
            <p className="text-sm mb-6" style={{ color: META }}>Best value for the long haul</p>
            <p className="mb-2">
              <span
                className="text-lg font-semibold mr-2"
                style={{ fontFamily: SERIF, color: META, textDecoration: "line-through" }}
              >
                $24.99
              </span>
              <span className="text-4xl font-bold" style={{ fontFamily: SERIF }}>$19.99</span>
              <span className="text-sm" style={{ color: META }}> / year</span>
            </p>
            <p className="mb-6">
              <span
                className="inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full"
                style={{ background: GOLD, color: INK, letterSpacing: "0.04em" }}
              >
                Launch discount
              </span>
            </p>
            <ul className="space-y-3 mb-8">
              {PLUS_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: SOFT_INK }}>
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#7A8B6F" }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => startCheckout("year")}
              disabled={loadingInterval !== null}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition disabled:opacity-60"
              style={{ background: INK, color: "#F7F2E8" }}
              onMouseEnter={(e) => { if (!loadingInterval) e.currentTarget.style.background = "#000"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = INK; }}
            >
              {loadingInterval === "year" ? "Redirecting…" : "Get Plus Annual"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-10" style={{ color: META }}>
          Cancel anytime from your account. No shame, no broken streaks, no catch.
        </p>
      </section>

      <footer style={{ background: INK, color: "#C6BBA4" }}>
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <p suppressHydrationWarning className="text-sm">
            &copy; {new Date().getFullYear()} BibleHabit, a division of HD Signals LLC.
          </p>
          <div className="flex justify-center gap-4 mt-3 text-xs">
            <a href="/privacy" className="transition hover:text-[#F4EEE1]">Privacy Policy</a>
            <a href="/terms" className="transition hover:text-[#F4EEE1]">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: PARCHMENT }} />}>
      <PricingContent />
    </Suspense>
  );
}
