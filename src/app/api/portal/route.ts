import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Creates a Stripe billing-portal session for an existing customer (by email).
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body.email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const stripe = new Stripe(secretKey);
  try {
    const customers = await stripe.customers.list({ email: body.email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) return NextResponse.json({ error: "No billing account" }, { status: 404 });

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: "https://biblehabit.co/profile",
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[portal] Stripe error:", e);
    return NextResponse.json({ error: "Portal failed" }, { status: 500 });
  }
}
