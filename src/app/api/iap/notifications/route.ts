export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { invalidateEntitlementCache } from "@/lib/entitlement";
import {
  verifyAppleSignedPayload,
  AppleJwsError,
  type AppleNotificationPayload,
  type AppleTransactionPayload,
  type AppleRenewalInfoPayload,
} from "@/lib/appleJws";

/**
 * App Store Server Notifications V2 — register this URL in App Store Connect
 * (App -> App Store Server Notifications). Keeps entitlement correct while
 * the app isn't running: renewals, cancellations, refunds, billing-retry,
 * and grace-period expiry.
 *
 * No session auth — Apple calls this directly. Trust comes entirely from
 * verifying the outer signedPayload JWS and the nested
 * signedTransactionInfo/signedRenewalInfo JWS against Apple's certificate
 * chain (src/lib/appleJws.ts). Always 200 quickly; Apple retries on anything
 * else for up to ~24h.
 *
 * ⚠️ Same trap as /api/iap/verify: only ever write status 'active', 'expired',
 * 'canceled', or 'past_due' — bh_is_pro() and entitlement.ts only recognize
 * those strings (plus comped, which this route never touches).
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

  const { error } = await supabaseAdmin.from("subscriptions").update(update).eq("email", existing.email);
  if (error) {
    console.error("[iap/notifications] update failed:", error.message);
    return NextResponse.json({ received: true, error: "db write failed" });
  }

  // Best-effort cache bust — resolve the auth user id from their profile so a
  // warm server instance doesn't serve a stale verdict for the next 60s.
  // Not fatal if this lookup misses; the in-process cache TTL is short and a
  // cold instance never had the stale entry to begin with.
  const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("email", existing.email).maybeSingle();
  if (profile?.id) invalidateEntitlementCache(profile.id);

  return NextResponse.json({ received: true });
}
