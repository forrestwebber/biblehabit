import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily-constructed Stripe client (server-side only). */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  _stripe = new Stripe(key);
  return _stripe;
}

// BibleHabit Plus price IDs (env-driven so test/live can differ per environment)
export const PLUS_MONTHLY_PRICE_ID = (process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || "").trim();
export const PLUS_ANNUAL_PRICE_ID = (process.env.STRIPE_PLUS_ANNUAL_PRICE_ID || "").trim();

// "Launch discount" coupon ($5.99 off, duration=forever so renewals stay
// discounted) auto-applied to annual checkout: $24.99/yr list -> $19/yr.
export const PLUS_ANNUAL_COUPON_ID = (process.env.STRIPE_PLUS_ANNUAL_COUPON_ID || "").trim();

export const PLUS_PRICE_IDS = [PLUS_MONTHLY_PRICE_ID, PLUS_ANNUAL_PRICE_ID].filter(Boolean);
