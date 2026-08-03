import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUserFromRequest, getEntitlement, SITE, OUR_PRICE_IDS } from "@/lib/entitlement";

export const dynamic = "force-dynamic";

/**
 * Subscription status for the Settings screen.
 *
 * Prefers the verified caller (bearer token → the entitlement helper, which
 * reads the database the webhook keeps current). The `?email=` form is kept
 * for legacy callers and only ever reports on a subscription record; it never
 * grants entitlement on its own.
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (user) {
    const ent = await getEntitlement(user);
    return NextResponse.json({
      active: ent.isPaid,
      status: ent.status,
      trialing: ent.status === "trialing",
      daysLeft: ent.daysLeft,
      comped: ent.comped,
      interval: ent.interval ?? undefined,
      renewsAt: ent.currentPeriodEnd ? formatDate(ent.currentPeriodEnd) : undefined,
    });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ active: false });

  // Database first — the webhook keeps this current, so no Stripe round trip.
  const { data: row } = await supabaseAdmin
    .from("subscriptions")
    .select("status, comped, price_interval, current_period_end")
    .eq("email", email)
    .maybeSingle();

  if (row && (row.comped || row.status === "active" || row.status === "trialing")) {
    return NextResponse.json({
      active: true,
      status: row.status,
      comped: row.comped,
      interval: row.price_interval ?? "year",
      renewsAt: row.current_period_end ? formatDate(row.current_period_end) : undefined,
    });
  }

  // Nothing on file — ask Stripe once (covers pre-webhook purchases).
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ active: false });

  const stripe = new Stripe(secretKey);
  try {
    const customers = await stripe.customers.list({ email, limit: 5 });
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 10 });
      const live = subs.data.find((s) => {
        if (s.status !== "active" && s.status !== "trialing") return false;
        const site = s.metadata?.site;
        if (site) return site === SITE;
        return s.items.data.some((i) => i.price?.id && OUR_PRICE_IDS.includes(i.price.id));
      });
      if (!live) continue;

      const item = live.items.data[0];
      const periodEnd = item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null;

      // Persist so entitlement stops depending on a live Stripe call.
      await supabaseAdmin.from("subscriptions").upsert(
        {
          email,
          stripe_customer_id: customer.id,
          stripe_subscription_id: live.id,
          status: live.status,
          price_interval: item?.price?.recurring?.interval ?? null,
          current_period_end: periodEnd,
          cancel_at_period_end: !!live.cancel_at_period_end,
          site: SITE,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      return NextResponse.json({
        active: true,
        status: live.status,
        interval: item?.price?.recurring?.interval ?? "year",
        renewsAt: periodEnd ? formatDate(periodEnd) : undefined,
      });
    }
    return NextResponse.json({ active: false });
  } catch (e) {
    console.error("[subscription] Stripe error:", e);
    return NextResponse.json({ active: false });
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}
