"use client";
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getStoreProducts, purchaseProduct, restoreStorePurchases, type StoreProduct } from "@/lib/storekit";

/**
 * BibleHabit Plus, sold through Apple In-App Purchase. Rendered INSTEAD of the
 * Stripe pricing grid whenever the site runs inside the native iOS app.
 *
 * App Store guideline 3.1.1 / 3.1.2: the plan name, length and price are shown
 * before purchase (Apple's own localized price from StoreKit, never a number we
 * format), the auto-renewal terms sit next to the purchase control with working
 * Terms and Privacy links, Restore Purchases is one tap away, and nothing on
 * this screen links out to a web checkout.
 *
 * Purchases are attributed to the signed-in account via appAccountToken and
 * verified server-side by /api/iap/verify before Plus is granted.
 */
const INK = "#221C14";
const SOFT_INK = "#5A4F3F";
const BODY = "#5C5142";
const META = "#8A7F6E";
const GOLD = "#C9962E";
const CARD = "#FFFDF8";
const TILE = "#FBF4E4";
const SERIF = "'Lora', serif";

/** App Store product ids — LOAD-BEARING. Must match App Store Connect exactly
 *  or StoreKit returns an empty list and the paywall shows the "unavailable"
 *  state. Both live in ASC with a 7-day free trial (`~/bin/asc_subs.py show bh`). */
const IAP = [
  { id: "co.biblehabit.app.premium.annual", key: "year" as const, name: "Plus Annual", fallbackPrice: "$19.99", per: "year", note: "Best value — two months free", badge: "BEST VALUE" as string | null },
  { id: "co.biblehabit.app.premium.monthly", key: "month" as const, name: "Plus Monthly", fallbackPrice: "$2.99", per: "month", note: "Cancel anytime", badge: null as string | null },
];

const PLUS_FEATURES = [
  "Pacing projections — see your finish date update live",
  "Personalized reflow suggestions when you fall behind",
  "Multiple simultaneous reading goals",
  "Streak repair — recover a broken streak once a month",
];

function periodWord(p?: { unit: string; value: number }): string | null {
  if (!p) return null;
  if (p.unit === "year" && p.value === 1) return "year";
  if (p.unit === "month" && p.value === 1) return "month";
  return `${p.value} ${p.unit}${p.value === 1 ? "" : "s"}`;
}

function trialWord(product?: StoreProduct): string | null {
  const o = product?.introOffer;
  if (!o || o.type !== "freeTrial") return null;
  const unit = o.periodUnit === "day" ? "day" : o.periodUnit;
  const n = o.periodValue * Math.max(1, o.periodCount);
  return `${n} ${unit}${n === 1 ? "" : "s"} free`;
}

export default function NativePaywall({ plan }: { plan: "free" | "plus" | null }) {
  const [choice, setChoice] = useState<"month" | "year">("year");
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [products, setProducts] = useState<StoreProduct[] | null>(null);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)).catch(() => setUserId(null));
    getStoreProducts(IAP.map((p) => p.id)).then(setProducts);
  }, []);

  const productFor = (key: "month" | "year") => IAP.find((p) => p.key === key)!;
  const live = (id: string) => products?.find((p) => p.id === id);

  const finish = (text: string) => {
    setNotice({ text, error: false });
    setTimeout(() => {
      window.location.href = "/today";
    }, 1200);
  };

  const subscribe = async () => {
    if (busy) return;
    if (!userId) {
      window.location.href = `/login?mode=signup&next=${encodeURIComponent("/pricing")}`;
      return;
    }
    setBusy("purchase");
    setNotice(null);
    const outcome = await purchaseProduct(productFor(choice).id, userId);
    switch (outcome.status) {
      case "success":
        if (outcome.verified) finish("You're on Plus. Taking you to today's reading…");
        else
          setNotice({
            text: `Apple confirmed your purchase, but we couldn't verify it yet (${outcome.error ?? "server error"}). Reopen the app in a moment or tap Restore Purchases — you will not be charged again.`,
            error: true,
          });
        break;
      case "userCancelled":
        break;
      case "pending":
        setNotice({ text: "Waiting on approval for this purchase (Ask to Buy). You'll get Plus as soon as it's approved.", error: false });
        break;
      case "productUnavailable":
        setNotice({ text: "These plans aren't available from the App Store right now. Please try again shortly.", error: true });
        break;
      case "verificationFailed":
        setNotice({ text: `Apple could not verify this purchase (${outcome.error ?? "unknown reason"}).`, error: true });
        break;
      case "networkError":
        setNotice({ text: "No connection to the App Store. Check your connection and try again.", error: true });
        break;
      case "notNative":
        setNotice({ text: "In-app purchase is only available in the BibleHabit app.", error: true });
        break;
      default:
        setNotice({ text: `Something went wrong (${outcome.error ?? "unknown"}). Please try again.`, error: true });
    }
    setBusy(null);
  };

  const restore = async () => {
    if (busy) return;
    setBusy("restore");
    setNotice(null);
    const r = await restoreStorePurchases();
    if (r.networkError) setNotice({ text: "No connection to the App Store. Check your connection and try again.", error: true });
    else if (r.verifiedCount > 0) finish("Purchases restored. Taking you to today's reading…");
    else setNotice({ text: "No active BibleHabit Plus subscription was found for this Apple ID.", error: false });
    setBusy(null);
  };

  const selected = productFor(choice);
  const selectedLive = live(selected.id);
  const selectedPrice = selectedLive?.displayPrice ?? selected.fallbackPrice;
  const selectedPer = periodWord(selectedLive?.subscriptionPeriod) ?? selected.per;
  const trial = trialWord(selectedLive) ?? "7 days free";

  if (plan === "plus") {
    return (
      <section className="px-6 pb-20 max-w-md mx-auto">
        <div className="rounded-2xl p-6 text-center" style={{ background: CARD, border: `1px solid ${GOLD}` }}>
          <Sparkles className="h-6 w-6 mx-auto mb-3" style={{ color: GOLD }} />
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: SERIF, color: INK }}>You&apos;re on BibleHabit Plus</h2>
          <p className="text-sm" style={{ color: BODY }}>
            Pacing projections, personalized reflow and multiple goals are unlocked. Manage or cancel your subscription any time in your Apple ID settings.
          </p>
          <a href="/today" className="inline-block mt-5 text-sm font-semibold px-5 py-2.5 rounded-full" style={{ background: INK, color: "#F7F2E8" }}>
            Back to today&apos;s reading
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 pb-24 max-w-md mx-auto">
      <div className="rounded-3xl p-6" style={{ background: CARD, border: "1px solid rgba(34,28,20,0.08)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
        <div className="inline-flex items-center gap-1 text-xs font-bold uppercase px-3 py-1 rounded-full mb-4" style={{ background: TILE, color: "#8A6A1E", letterSpacing: "0.04em" }}>
          <Sparkles className="h-3 w-3" /> {trial}
        </div>
        <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: SERIF, color: INK }}>BibleHabit Plus</h2>
        <p className="text-sm mb-5" style={{ color: BODY }}>
          See the road ahead. Try it free, cancel anytime — your reading plans, streaks and progress stay free forever either way.
        </p>

        {products !== null && products.length === 0 && (
          <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "#FBEAEA", color: "#8A2E2E" }}>
            Subscription options aren&apos;t available from the App Store right now. Please try again shortly.
          </div>
        )}

        <div className="space-y-3">
          {IAP.map((p) => {
            const isSel = choice === p.key;
            const lp = live(p.id);
            const price = lp?.displayPrice ?? p.fallbackPrice;
            const per = periodWord(lp?.subscriptionPeriod) ?? p.per;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setChoice(p.key)}
                className="w-full text-left rounded-2xl p-4 transition"
                style={{ border: `1.5px solid ${isSel ? GOLD : "rgba(34,28,20,0.12)"}`, background: isSel ? TILE : CARD }}
                aria-pressed={isSel}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold" style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>
                      {p.name} — {price}
                      <span className="text-sm font-normal" style={{ color: META }}> / {per}</span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: META }}>{p.note}</p>
                  </div>
                  <span
                    aria-hidden
                    className="flex-shrink-0 rounded-full"
                    style={{ width: 22, height: 22, border: isSel ? `6px solid ${GOLD}` : "1.5px solid rgba(34,28,20,0.3)", background: "#FFFDF8" }}
                  />
                </div>
                {p.badge && (
                  <span className="inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full mt-3" style={{ background: GOLD, color: INK, letterSpacing: "0.04em" }}>
                    {p.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <ul className="space-y-2.5 mt-6">
          {PLUS_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm" style={{ color: SOFT_INK }}>
              <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#7A8B6F" }} />
              {f}
            </li>
          ))}
        </ul>

        {notice && (
          <div className="rounded-xl p-3 mt-5 text-sm" style={{ background: notice.error ? "#FBEAEA" : TILE, color: notice.error ? "#8A2E2E" : SOFT_INK }}>
            {notice.text}
          </div>
        )}

        <button
          type="button"
          onClick={subscribe}
          disabled={busy !== null || userId === undefined}
          className="w-full flex items-center justify-center py-3 rounded-2xl font-semibold mt-5 transition disabled:opacity-60"
          style={{ background: GOLD, color: INK }}
        >
          {busy === "purchase" ? "Processing…" : userId === null ? "Sign in to start your free trial" : "Start free trial"}
        </button>
        <button
          type="button"
          onClick={restore}
          disabled={busy !== null}
          className="w-full py-2.5 mt-2 text-sm font-semibold rounded-2xl transition disabled:opacity-60"
          style={{ color: SOFT_INK }}
        >
          {busy === "restore" ? "Restoring…" : "Restore purchases"}
        </button>

        {/* Apple requires the auto-renewal terms next to the purchase control. */}
        <p className="text-xs mt-4" style={{ color: META, lineHeight: 1.5 }}>
          {trial}, then {selectedPrice} per {selectedPer}. Payment is charged to your Apple ID account at the end of the trial. The subscription renews automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID settings.{" "}
          <a href="/terms" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>Terms of Use</a>
          {" · "}
          <a href="/privacy" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>Privacy Policy</a>
        </p>
      </div>
    </section>
  );
}
