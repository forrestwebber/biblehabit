export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { verifyUserFromRequest } from "@/lib/supabase/verify-user";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Creates a Stripe Billing Portal session for the signed-in Plus subscriber
 * so they can update payment method, switch monthly/annual, or cancel.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("stripe_customer_id")
      .eq("email", user.email)
      .single();

    if (!client?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://biblehabit.co";

    const session = await stripe.billingPortal.sessions.create({
      customer: client.stripe_customer_id,
      return_url: `${baseUrl}/today`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe portal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
