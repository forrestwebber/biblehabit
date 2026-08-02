import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Looks up whether the given email has an active/trialing BibleHabit Plus
// subscription in Stripe. Read-only; no data is stored.
export async function GET(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const email = req.nextUrl.searchParams.get("email");
  if (!secretKey) return NextResponse.json({ active: false });
  if (!email) return NextResponse.json({ active: false });

  const stripe = new Stripe(secretKey);
  try {
    const customers = await stripe.customers.list({ email, limit: 5 });
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 5,
      });
      const live = subs.data.find((s) => s.status === "active" || s.status === "trialing");
      if (live) {
        const item = live.items.data[0];
        const periodEnd = item?.current_period_end;
        return NextResponse.json({
          active: true,
          status: live.status,
          interval: item?.price?.recurring?.interval ?? "year",
          renewsAt: periodEnd
            ? new Date(periodEnd * 1000).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
            : undefined,
        });
      }
    }
    return NextResponse.json({ active: false });
  } catch (e) {
    console.error("[subscription] Stripe error:", e);
    return NextResponse.json({ active: false });
  }
}
