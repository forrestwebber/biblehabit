export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, PLUS_PRICE_IDS } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * BibleHabit Plus billing webhook.
 *
 * IMPORTANT: this Stripe account (HD Signals LLC) is shared with Texas
 * Signals and other products. Every handler below filters on
 * metadata.site === "biblehabit.co" (checkout/subscription events) or on
 * a BibleHabit Plus price ID (invoice events, which don't carry our
 * metadata) before touching Supabase — never process another product's
 * event here.
 *
 * "Never charge without delivering": profiles.plan is flipped to 'plus'
 * here, server-side, before any UI is allowed to claim Plus access. The
 * client never sets its own plan optimistically from a redirect param —
 * it always re-reads profiles.plan.
 */

async function setPlan(opts: { userId?: string | null; email?: string | null; plan: "free" | "plus" }) {
  const { userId, email, plan } = opts;
  if (userId) {
    await supabaseAdmin.from("profiles").update({ plan, updated_at: new Date().toISOString() }).eq("id", userId);
  } else if (email) {
    await supabaseAdmin.from("profiles").update({ plan, updated_at: new Date().toISOString() }).eq("email", email);
  }
}

async function upsertClient(opts: {
  email: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan?: "free" | "plus";
}) {
  const { email, stripeCustomerId, stripeSubscriptionId, plan } = opts;
  await supabaseAdmin
    .from("clients")
    .upsert(
      {
        email,
        ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
        ...(stripeSubscriptionId ? { stripe_subscription_id: stripeSubscriptionId } : {}),
        ...(plan ? { plan } : {}),
      },
      { onConflict: "email" }
    );
}

async function resolveEmail(stripe: Stripe, customerId: string | null | undefined): Promise<string | null> {
  if (!customerId) return null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer as Stripe.Customer).email || null;
  } catch {
    return null;
  }
}

function subscriptionPriceId(sub: Stripe.Subscription): string {
  return sub.items?.data?.[0]?.price?.id || "";
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (!webhookSecret || !sig) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.site !== "biblehabit.co") break;

        const email = session.customer_email || (await resolveEmail(stripe, session.customer as string));
        const userId = session.client_reference_id || session.metadata?.supabase_user_id || null;

        if (email) {
          await upsertClient({
            email,
            stripeCustomerId: (session.customer as string) || null,
            stripeSubscriptionId: (session.subscription as string) || null,
            plan: "plus",
          });
        }
        await setPlan({ userId, email, plan: "plus" });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        if (!PLUS_PRICE_IDS.includes(subscriptionPriceId(sub))) break;

        const email = await resolveEmail(stripe, sub.customer as string);
        if (!email) break;

        const status = sub.status;
        if (status === "active" || status === "trialing") {
          await upsertClient({ email, stripeSubscriptionId: sub.id, plan: "plus" });
          await setPlan({ email, plan: "plus" });
        } else if (status === "past_due" || status === "unpaid" || status === "canceled" || status === "incomplete_expired") {
          await upsertClient({ email, plan: "free" });
          await setPlan({ email, plan: "free" });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (!PLUS_PRICE_IDS.includes(subscriptionPriceId(sub))) break;

        const email = await resolveEmail(stripe, sub.customer as string);
        if (email) {
          await upsertClient({ email, plan: "free" });
          await setPlan({ email, plan: "free" });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const priceRef = invoice.lines?.data?.[0]?.pricing?.price_details?.price;
        const priceId = typeof priceRef === "string" ? priceRef : priceRef?.id || "";
        if (!PLUS_PRICE_IDS.includes(priceId)) break;

        const email = invoice.customer_email || (await resolveEmail(stripe, invoice.customer as string));
        if (email) {
          await upsertClient({ email, plan: "free" });
          await setPlan({ email, plan: "free" });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("BibleHabit webhook handler error:", err);
    // Still ack the event so Stripe doesn't infinitely retry a code bug;
    // the error is logged for follow-up.
  }

  return NextResponse.json({ received: true });
}
