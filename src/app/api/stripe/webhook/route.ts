import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE, OUR_PRICE_IDS } from "@/lib/entitlement";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook → public.subscriptions.
 *
 * Registered endpoint: https://biblehabit.co/api/stripe/webhook
 *   (we_1TvfnmHZglL7cJQjKp5DcTl0 — checkout.session.completed,
 *    customer.subscription.updated, customer.subscription.deleted,
 *    invoice.payment_failed)
 *
 * The Stripe account is shared across Forrest's businesses, so EVERY event is
 * attributed before it is written: metadata.site must be "biblehabit.co", or
 * failing that the line item must carry one of the two BibleHabit Plus prices.
 * Anything else is acknowledged and ignored — a Texas Signals or Dreams &
 * Myths subscription must never unlock BibleHabit.
 *
 * Persisting status here is what keeps entitlement a database read instead of
 * a live Stripe call on every request.
 */

type AnyRecord = Record<string, unknown> & { metadata?: Record<string, string> | null };

function isOurs(metadata: Record<string, string> | null | undefined, priceIds: string[]): boolean {
  const site = metadata?.site;
  if (site) return site === SITE;
  return priceIds.some((id) => OUR_PRICE_IDS.includes(id));
}

function toIso(unixSeconds: number | null | undefined): string | null {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

async function upsert(email: string, patch: Record<string, unknown>) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    { email: normalized, site: SITE, updated_at: new Date().toISOString(), ...patch },
    { onConflict: "email" }
  );
  if (error) console.error("[stripe-webhook] subscriptions upsert failed:", error);
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Billing not configured" }, { status: 503 });

  const stripe = new Stripe(secretKey);
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // No signing secret configured (local/dev) — parse but do not trust.
      console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET missing; skipping signature check");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[stripe-webhook] signature verification failed:", message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  const emailFromCustomer = async (customerId: string | null | undefined): Promise<string | null> => {
    if (!customerId) return null;
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if ("deleted" in customer && customer.deleted) return null;
      return (customer as Stripe.Customer).email ?? null;
    } catch {
      return null;
    }
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.site !== SITE) {
          return NextResponse.json({ received: true, skipped: session.metadata?.site ?? "no-site" });
        }

        const email =
          session.customer_details?.email ||
          session.customer_email ||
          (await emailFromCustomer(session.customer as string));
        if (!email) {
          console.error("[stripe-webhook] checkout.session.completed with no email", session.id);
          break;
        }

        // Pull the subscription for authoritative status + period end.
        let status = "active";
        let interval: string | null = null;
        let periodEnd: string | null = null;
        let cancelAtPeriodEnd = false;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const item = sub.items.data[0];
          status = sub.status;
          interval = item?.price?.recurring?.interval ?? null;
          periodEnd = toIso(item?.current_period_end);
          cancelAtPeriodEnd = !!sub.cancel_at_period_end;
        }

        await upsert(email, {
          stripe_customer_id: (session.customer as string) ?? null,
          stripe_subscription_id: (session.subscription as string) ?? null,
          status,
          price_interval: interval,
          current_period_end: periodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          last_checked_at: new Date().toISOString(),
        });
        console.log(`[stripe-webhook] ${email} → ${status} (checkout complete)`);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const priceIds = sub.items.data.map((i) => i.price?.id).filter(Boolean) as string[];
        if (!isOurs(sub.metadata, priceIds)) {
          return NextResponse.json({ received: true, skipped: sub.metadata?.site ?? "not-biblehabit" });
        }
        const email = await emailFromCustomer(sub.customer as string);
        if (!email) break;

        const item = sub.items.data[0];
        await upsert(email, {
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          status: sub.status,
          price_interval: item?.price?.recurring?.interval ?? null,
          current_period_end: toIso(item?.current_period_end),
          cancel_at_period_end: !!sub.cancel_at_period_end,
          last_checked_at: new Date().toISOString(),
        });
        console.log(`[stripe-webhook] ${email} → ${sub.status} (subscription ${event.type})`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const priceIds = sub.items.data.map((i) => i.price?.id).filter(Boolean) as string[];
        if (!isOurs(sub.metadata, priceIds)) {
          return NextResponse.json({ received: true, skipped: sub.metadata?.site ?? "not-biblehabit" });
        }
        const email = await emailFromCustomer(sub.customer as string);
        if (!email) break;

        const item = sub.items.data[0];
        await upsert(email, {
          stripe_subscription_id: sub.id,
          status: "canceled",
          current_period_end: toIso(item?.current_period_end),
          cancel_at_period_end: false,
          last_checked_at: new Date().toISOString(),
        });
        console.log(`[stripe-webhook] ${email} → canceled`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & AnyRecord;
        const lineMeta =
          (invoice as unknown as { subscription_details?: { metadata?: Record<string, string> } })
            .subscription_details?.metadata ??
          (invoice.lines?.data?.[0]?.metadata as Record<string, string> | undefined) ??
          null;
        const priceIds = (invoice.lines?.data ?? [])
          .map((l) => (l as unknown as { price?: { id?: string } }).price?.id)
          .filter(Boolean) as string[];
        if (!isOurs(lineMeta, priceIds)) {
          return NextResponse.json({ received: true, skipped: "not-biblehabit" });
        }

        const email =
          invoice.customer_email || (await emailFromCustomer(invoice.customer as string));
        if (!email) break;

        // past_due keeps access until current_period_end (see bh_is_entitled).
        await upsert(email, { status: "past_due", last_checked_at: new Date().toISOString() });
        console.log(`[stripe-webhook] ${email} → past_due (payment failed)`);
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error("[stripe-webhook] handler error:", e);
    // 500 so Stripe retries rather than dropping a paid signup on the floor.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
