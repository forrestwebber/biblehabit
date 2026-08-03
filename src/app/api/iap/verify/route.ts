export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUserFromRequest, invalidateEntitlementCache } from "@/lib/entitlement";
import { verifyAppleSignedPayload, AppleJwsError, type AppleTransactionPayload } from "@/lib/appleJws";

// PRODUCT IDS ARE LOAD-BEARING — a transaction for a product id we don't
// recognize is rejected, never granted. Mirrors ProUpsell.tsx's IAP array;
// verify both stay in sync with `~/bin/asc_subs.py show bh`.
const BUNDLE_ID = "co.biblehabit.app";
const KNOWN_PRODUCT_IDS = new Set([
  "co.biblehabit.app.premium.monthly",
  "co.biblehabit.app.premium.annual",
]);

/**
 * The server-side half of "never trust the client". The app hands us a
 * StoreKit 2 signed transaction (a JWS) — this verifies Apple's certificate
 * chain and signature over it (src/lib/appleJws.ts), checks the claims that
 * matter (bundle id, product id, expiry, revocation), and ONLY THEN writes
 * entitlement.
 *
 * ⚠️ THE TRAP THIS ROUTE MUST NOT REINTRODUCE: bh_is_pro() (the Postgres RLS
 * function) and this app's own resolve() in entitlement.ts both grant Pro
 * ONLY for `comped = true` OR `status IN ('active', 'trialing')`. Writing any
 * other status string — even a perfectly sensible one like 'apple' — makes
 * the row invisible to both, and the reader pays and gets nothing. This route
 * only ever writes 'active', 'expired', or 'canceled'.
 *
 * Auth: Authorization: Bearer <supabase access token>, same convention as
 * every other BibleHabit API route (getUserFromRequest).
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  let body: { signedTransactionInfo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const { signedTransactionInfo } = body;
  if (!signedTransactionInfo) {
    return NextResponse.json({ ok: false, error: "signedTransactionInfo is required" }, { status: 400 });
  }

  let payload: AppleTransactionPayload;
  try {
    payload = verifyAppleSignedPayload<AppleTransactionPayload>(signedTransactionInfo);
  } catch (err) {
    const message = err instanceof AppleJwsError ? err.message : "Signature verification failed";
    console.error(`[iap/verify] rejected for ${user.email}: ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  if (payload.bundleId !== BUNDLE_ID) {
    console.error(`[iap/verify] bundle id mismatch: got ${payload.bundleId}`);
    return NextResponse.json({ ok: false, error: "Bundle id mismatch" }, { status: 400 });
  }
  if (!KNOWN_PRODUCT_IDS.has(payload.productId)) {
    console.error(`[iap/verify] unknown product id: ${payload.productId}`);
    return NextResponse.json({ ok: false, error: "Unknown product id" }, { status: 400 });
  }
  if (payload.appAccountToken && payload.appAccountToken !== user.id) {
    console.error(
      `[iap/verify] appAccountToken ${payload.appAccountToken} does not match session user ${user.id} — proceeding on session identity`
    );
  }

  const revoked = !!payload.revocationDate;
  const expiresAt = payload.expiresDate ? new Date(payload.expiresDate) : null;
  const status = revoked ? "canceled" : expiresAt && expiresAt.getTime() > Date.now() ? "active" : "expired";
  const interval: "month" | "year" = payload.productId.endsWith(".annual") ? "year" : "month";
  const nowIso = new Date().toISOString();

  // onConflict: "email" — subscriptions.email is the primary key. Only the
  // columns below are ever written, so an existing Stripe row's
  // stripe_customer_id/stripe_subscription_id/comped survive untouched if
  // the same person also has a web subscription; PostgREST's upsert updates
  // only the supplied columns on conflict, not the whole row. `comped` is
  // deliberately OMITTED so an Apple purchase can never clear a grandfathered
  // account's free-Pro flag.
  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      email: user.email,
      store: "apple",
      apple_user_id: user.id,
      status,
      price_interval: interval,
      apple_original_transaction_id: payload.originalTransactionId,
      apple_product_id: payload.productId,
      apple_environment: payload.environment,
      apple_expires_at: expiresAt ? expiresAt.toISOString() : null,
      current_period_end: expiresAt ? expiresAt.toISOString() : null,
      site: "biblehabit.co",
      last_checked_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("[iap/verify] upsert failed:", error.message);
    return NextResponse.json({ ok: false, error: "Database write failed" }, { status: 500 });
  }

  invalidateEntitlementCache(user.id);

  return NextResponse.json({
    ok: true,
    status,
    tier: status === "active" ? "pro" : "free",
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  });
}
