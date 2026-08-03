import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { SITE, TRIAL_DAYS, getUserFromRequest, getEntitlement } from "@/lib/entitlement";

// Live BibleHabit Plus pricing (verified in Stripe 2026-08-02):
//   month: $2.99/mo   year: $24.99/yr   coupon Cd5l1UvN: $5.00 off forever → $19.99/yr
// Vercel prod env carries these as STRIPE_PLUS_* — fallbacks match the live values.
const PRICES: Record<string, string> = {
  month: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || "price_1TvfndHZglL7cJQjvd4iOJFV",
  year: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID || "price_1TvfndHZglL7cJQjWe4BsMOA",
};
const YEAR_LAUNCH_COUPON = process.env.STRIPE_PLUS_ANNUAL_COUPON_ID || "Cd5l1UvN";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  let body: { plan?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const plan = body.plan === "month" ? "month" : "year";
  const stripe = new Stripe(secretKey);

  // ── Trial days are decided here, never by the client ──────────
  // One 7-day trial per account. Somebody subscribing mid-trial keeps the days
  // they have left; somebody whose trial already ran out gets none, so the
  // "your 7 days are up" wall can't be turned into a second free week.
  // Anonymous checkout (no account yet) gets the full 7.
  let trialDays = TRIAL_DAYS;
  let email = body.email;
  const user = await getUserFromRequest(req);
  if (user) {
    email = user.email;
    const ent = await getEntitlement(user);
    trialDays = ent.status === "trialing" ? ent.daysLeft : 0;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      ...(plan === "year" ? { discounts: [{ coupon: YEAR_LAUNCH_COUPON }] } : {}),
      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        // Tags the subscription so our webhook — and every sibling site's
        // webhook on this shared Stripe account — attributes it correctly.
        metadata: { site: SITE, product: "biblehabit_plus", plan },
      },
      metadata: { site: SITE, product: "biblehabit_plus", plan },
      customer_email: email || undefined,
      allow_promotion_codes: plan === "year" ? undefined : true,
      success_url: "https://biblehabit.co/today?plus=welcome",
      cancel_url: "https://biblehabit.co/plus",
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout] Stripe error:", e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
