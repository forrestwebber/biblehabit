"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

/**
 * Plan + billing summary for the profile page. Reads profiles.plan
 * (server-side truth, set only by the Stripe webhook) and, for Plus
 * members, offers a link into the Stripe Billing Portal.
 */
export default function MembershipCard() {
  const [plan, setPlan] = useState<"free" | "plus" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (!cancelled) setPlan((data?.plan as "free" | "plus") || "free");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (plan === null) return null;

  const openPortal = async () => {
    setPortalError(null);
    setPortalLoading(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setPortalLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Could not open billing portal");
      window.location.href = json.url;
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : "Something went wrong.");
      setPortalLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
      style={{ background: "#FFFDF8", border: "1px solid rgba(34,28,20,0.08)", boxShadow: "0 12px 30px -20px rgba(34,28,20,0.3)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={
            plan === "plus"
              ? { background: "radial-gradient(circle at 50% 68%, #F2D793 0%, #C9962E 58%, #A97C1E 100%)" }
              : { background: "#F2E9D6" }
          }
        >
          <Sparkles className="h-5 w-5" style={{ color: plan === "plus" ? "#221C14" : "#8A7F6E" }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#221C14" }}>
            {plan === "plus" ? "BibleHabit Plus" : "Free Plan"}
          </p>
          <p className="text-xs" style={{ color: "#8A7F6E" }}>
            {plan === "plus" ? "Pacing projections, reflow, and more are unlocked" : "Reading plans and progress, always free"}
          </p>
        </div>
      </div>
      {plan === "plus" ? (
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full transition disabled:opacity-60"
          style={{ background: "#221C14", color: "#F7F2E8" }}
        >
          {portalLoading ? "Opening…" : "Manage Billing"}
        </button>
      ) : (
        <a
          href="/pricing"
          className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full transition"
          style={{ background: "#C9962E", color: "#221C14" }}
        >
          Upgrade
        </a>
      )}
      {portalError && (
        <p className="text-xs" style={{ color: "#8A2E2E" }}>{portalError}</p>
      )}
    </div>
  );
}
