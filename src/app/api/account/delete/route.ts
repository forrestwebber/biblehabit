export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyUserFromRequest } from "@/lib/supabase/verify-user";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/**
 * Permanently deletes the signed-in user's BibleHabit account (Apple App
 * Review guideline 5.1.1(v) — account deletion must be available in-app,
 * not just via a support request).
 *
 * Cancels any active Stripe subscription first (best-effort — a billing
 * failure must never block the account deletion the user asked for), then
 * deletes the Supabase auth user. profiles / reading_progress / goals /
 * reading_positions all reference auth.users(id) ON DELETE CASCADE, so a
 * single deleteUser call removes every row of the user's data.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    // Best-effort: cancel any active Stripe subscription so deletion also
    // stops billing. Failures here are logged, not fatal — the user's
    // deletion request must still succeed.
    try {
      const { data: client } = await supabaseAdmin
        .from("clients")
        .select("stripe_customer_id")
        .eq("email", user.email)
        .single();

      if (client?.stripe_customer_id) {
        const stripe = getStripe();
        const subs = await stripe.subscriptions.list({
          customer: client.stripe_customer_id,
          status: "active",
          limit: 10,
        });
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      }
    } catch (billingErr) {
      console.error("Account deletion: Stripe cleanup failed (continuing):", billingErr);
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("Account deletion: Supabase deleteUser failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Account deletion error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
