"use client";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const INK = "#221C14";
const GOLD = "#C9962E";
const CARD = "#FFFDF8";
const DISMISS_KEY = "bh-upgrade-cta-dismissed";

/**
 * Single, tasteful, dismissible upgrade card for free users on /today.
 * Reads plan from `profiles` (server-side source of truth) — renders
 * nothing for Plus members or while that check is in flight, and nothing
 * user-hostile is ever gated behind it (this is purely an invitation).
 */
export default function UpgradeCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY)) return;

    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (!cancelled && profile?.plan !== "plus") setVisible(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div
      className="relative rounded-2xl p-5 mb-6 flex items-start gap-4"
      style={{ background: CARD, border: `1px solid rgba(201,150,46,0.35)`, boxShadow: "0 12px 30px -20px rgba(34,28,20,0.3)" }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "radial-gradient(circle at 50% 68%, #F2D793 0%, #C9962E 58%, #A97C1E 100%)" }}
      >
        <Sparkles className="h-5 w-5" style={{ color: INK }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: INK }}>See exactly where you&apos;ll land</p>
        <p className="text-sm mt-0.5" style={{ color: "#5C5142" }}>
          BibleHabit Plus adds pacing projections, personalized reflow when life gets busy, and
          multiple reading goals at once — from $4.99/mo.
        </p>
        <a
          href="/pricing"
          className="inline-block mt-3 text-sm font-semibold transition"
          style={{ color: "#8A6A1E" }}
        >
          See Plus →
        </a>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 transition"
        style={{ color: "#B0A48C" }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
