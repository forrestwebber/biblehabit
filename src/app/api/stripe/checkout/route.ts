export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLUS_MONTHLY_PRICE_ID, PLUS_ANNUAL_PRICE_ID } from "@/lib/stripe";
import { verifyUserFromRequest } from "@/lib/supabase/verify-user";

/**
 * Creates a Stripe Checkout session for BibleHabit Plus.
 * Body: { interval: "month" | "year" }
 * Requires an Authorization: Bearer <supabase access_token> header —
 * verified server-side against Supabase Auth before we ever talk to Stripe.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { interval } = await req.json().catch(() => ({ interval: "month" }));
    const isAnnual = interval === "year";
    const priceId = isAnnual ? PLUS_ANNUAL_PRICE_ID : PLUS_MONTHLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured. Contact support." },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://biblehabit.co";

    // Reuse an existing Stripe customer for this email if one exists, so a
    // returning user doesn't accumulate duplicate customer records.
    let customerId: string | undefined;
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerId ? { customer: customerId } : { customer_email: user.email }),
      client_reference_id: user.id,
      success_url: `${baseUrl}/today?upgraded=1`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
      allow_promotion_codes: true,
      metadata: {
        site: "biblehabit.co",
        supabase_user_id: user.id,
        billing: isAnnual ? "annual" : "monthly",
      },
      subscription_data: {
        metadata: {
          site: "biblehabit.co",
          supabase_user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
