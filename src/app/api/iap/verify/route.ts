export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyUserFromRequest } from "@/lib/supabase/verify-user";
import { verifyAppleSignedPayload, AppleJwsError, type AppleTransactionPayload } from "@/lib/appleJws";

/**
 * The server-side half of "never trust the client" for Apple In-App Purchase.
 *
 * The iOS app (a Capacitor shell loading biblehabit.co) buys BibleHabit Plus
 * through StoreKit 2 and POSTs the signed transaction (a JWS) here. We verify
 * Apple's certificate chain and signature over it (src/lib/appleJws.ts), check
 * the claims that matter (bundle id, product id, expiry, revocation), and ONLY
 * THEN write entitlement.
 *
 * Entitlement in this codebase is `profiles.plan` ('free' | 'plus') — the same
 * column the Stripe webhook writes for web subscribers — so every gate in the
 * app (PacingPanel, MembershipCard, UpgradeCTA) lights up for an Apple
 * subscriber exactly as it does for a Stripe one. The `subscriptions` row is
 * kept too: App Store Server Notifications find the account by
 * apple_original_transaction_id, and it records which store the plan came from.
 *
 * App Store Review 2026-09-03 (Guideline 3.1.1): "content purchased outside the
 * app ... isn't available to purchase using In-App Purchase." This route, the
 * paywall in NativePaywall.tsx and the two subscriptions in App Store Connect
 * are the fix — Plus is now purchasable in the app.
 *
 * Auth: Authorization: Bearer <supabase access token>, verified server-side.
 */
const BUNDLE_ID = "co.biblehabit.app";

// PRODUCT IDS ARE LOAD-BEARING — a transaction for a product id we don't
// recognize is rejected, never granted. Must match App Store Connect and
// NativePaywall.tsx exactly (`~/bin/asc_subs.py show bh`).
const KNOWN_PRODUCT_IDS = new Set([
  "co.biblehabit.app.premium.monthly",
  "co.biblehabit.app.premium.annual",
]);

export async function POST(req: NextRequest) {
  const user = await verifyUserFromRequest(req);
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
  const email = user.email.toLowerCase();

  // subscriptions.email is the primary key. Only the columns below are
  // written, so an existing row's stripe_* ids and `comped` survive untouched
  // (PostgREST upsert updates only the supplied columns on conflict).
  const { data: row, error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        email,
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
    )
    .select("status, comped")
    .single();

  if (error) {
    console.error("[iap/verify] upsert failed:", error.message);
    return NextResponse.json({ ok: false, error: "Database write failed" }, { status: 500 });
  }

  // The permission itself. A comped account never loses Plus because an Apple
  // transaction expired.
  const plan: "plus" | "free" = row?.comped || row?.status === "active" || row?.status === "trialing" ? "plus" : "free";
  const { error: planError } = await supabaseAdmin
    .from("profiles")
    .update({ plan, updated_at: nowIso })
    .eq("id", user.id);
  if (planError) {
    console.error("[iap/verify] profiles.plan update failed:", planError.message);
    return NextResponse.json({ ok: false, error: "Database write failed" }, { status: 500 });
  }

  console.log(`[iap/verify] ${email} ${payload.productId} ${payload.environment} -> ${status} (plan=${plan})`);

  return NextResponse.json({
    ok: true,
    status,
    tier: plan,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  });
}
