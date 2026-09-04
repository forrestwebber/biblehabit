export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  verifyAppleSignedPayload,
  AppleJwsError,
  type AppleNotificationPayload,
  type AppleTransactionPayload,
  type AppleRenewalInfoPayload,
} from "@/lib/appleJws";

/**
 * App Store Server Notifications V2. App Store Connect already points both
 * the production and sandbox URLs at https://biblehabit.co/api/iap/notifications.
 * Keeps entitlement correct while the app isn't running: renewals,
 * cancellations, refunds, billing-retry, and grace-period expiry.
 *
 * No session auth — Apple calls this directly. Trust comes entirely from
 * verifying the outer signedPayload JWS and the nested transaction/renewal
 * JWS against Apple's certificate chain (src/lib/appleJws.ts). Always answer
 * 200 quickly; Apple retries anything else for up to ~24h.
 *
 * Writes: the `subscriptions` row found by apple_original_transaction_id, then
 * `profiles.plan` for that email — the column every gate in the app reads.
 */
const BUNDLE_ID = "co.biblehabit.app";

export async function POST(req: NextRequest) {
  let body: { signedPayload?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true, error: "invalid JSON" });
  }
  if (!body.signedPayload) {
    return NextResponse.json({ received: true, error: "missing signedPayload" });
  }

  let envelope: AppleNotificationPayload;
  try {
    envelope = verifyAppleSignedPayload<AppleNotificationPayload>(body.signedPayload);
  } catch (err) {
    const message = err instanceof AppleJwsError ? err.message : "verification failed";
    console.error("[iap/notifications] rejected outer envelope:", message);
    return NextResponse.json({ received: true, error: message });
  }

  // Apple's "Send Test Notification" carries no data — acknowledge it.
  if (envelope.notificationType === "TEST") {
    return NextResponse.json({ received: true });
  }

  const data = envelope.data;
  if (!data || data.bundleId !== BUNDLE_ID) {
    console.error(`[iap/notifications] bundle id mismatch or missing data: ${data?.bundleId}`);
    return NextResponse.json({ received: true, error: "bundle id mismatch" });
  }

  let transaction: AppleTransactionPayload | null = null;
  if (data.signedTransactionInfo) {
    try {
      transaction = verifyAppleSignedPayload<AppleTransactionPayload>(data.signedTransactionInfo);
    } catch (err) {
      console.error("[iap/notifications] rejected nested signedTransactionInfo:", err);
    }
  }
  let renewalInfo: AppleRenewalInfoPayload | null = null;
  if (data.signedRenewalInfo) {
    try {
      renewalInfo = verifyAppleSignedPayload<AppleRenewalInfoPayload>(data.signedRenewalInfo);
    } catch (err) {
      console.error("[iap/notifications] rejected nested signedRenewalInfo:", err);
    }
  }

  const originalTransactionId = transaction?.originalTransactionId ?? renewalInfo?.originalTransactionId;
  if (!originalTransactionId) {
    console.error(`[iap/notifications] ${envelope.notificationType} carried no originalTransactionId`);
    return NextResponse.json({ received: true });
  }

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("email")
    .eq("apple_original_transaction_id", originalTransactionId)
    .maybeSingle();

  if (!existing) {
    // The app's /api/iap/verify creates the row at purchase time; a
    // notification can only ever race it by seconds. Apple will retry.
    console.error(
      `[iap/notifications] no subscriptions row yet for originalTransactionId ${originalTransactionId} (${envelope.notificationType})`
    );
    return NextResponse.json({ received: true });
  }

  const nowIso = new Date().toISOString();
  const update: Record<string, unknown> = {
    apple_last_notification_type: envelope.subtype ? `${envelope.notificationType}:${envelope.subtype}` : envelope.notificationType,
    apple_last_notification_at: nowIso,
    updated_at: nowIso,
  };

  switch (envelope.notificationType) {
    case "SUBSCRIBED":
    case "DID_RENEW":
      update.status = "active";
      if (transaction?.expiresDate) {
        update.apple_expires_at = new Date(transaction.expiresDate).toISOString();
        update.current_period_end = update.apple_expires_at;
      }
      break;

    case "DID_FAIL_TO_RENEW":
      if (envelope.subtype !== "GRACE_PERIOD") {
        update.status = "past_due";
      }
      break;

    case "GRACE_PERIOD_EXPIRED":
    case "EXPIRED":
      update.status = "expired";
      break;

    case "DID_CHANGE_RENEWAL_STATUS":
      if (renewalInfo) {
        update.apple_auto_renew_status = renewalInfo.autoRenewStatus === 1;
        update.apple_auto_renew_product_id = renewalInfo.autoRenewProductId ?? null;
      }
      break;

    case "REFUND":
    case "REVOKE":
      update.status = "canceled";
      break;

    default:
      break;
  }

  const { data: row, error } = await supabaseAdmin
    .from("subscriptions")
    .update(update)
    .eq("email", existing.email)
    .select("status, comped")
    .single();
  if (error) {
    console.error("[iap/notifications] update failed:", error.message);
    return NextResponse.json({ received: true, error: "db write failed" });
  }

  // Mirror the verdict into profiles.plan — the column the app actually gates on.
  const plan: "plus" | "free" = row?.comped || row?.status === "active" || row?.status === "trialing" ? "plus" : "free";
  const { error: planError } = await supabaseAdmin
    .from("profiles")
    .update({ plan, updated_at: nowIso })
    .eq("email", existing.email);
  if (planError) {
    console.error("[iap/notifications] profiles.plan update failed:", planError.message);
  }

  console.log(`[iap/notifications] ${envelope.notificationType}${envelope.subtype ? ":" + envelope.subtype : ""} ${existing.email} -> ${row?.status} (plan=${plan})`);
  return NextResponse.json({ received: true });
}
