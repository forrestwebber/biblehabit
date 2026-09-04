/**
 * Thin wrapper over the native StoreKit2 Capacitor plugin
 * (~/slacked-internal-dev/projects/capacitor-storekit2), reached through
 * window.Capacitor.Plugins.StoreKit2 — not an npm import (this repo's
 * biblehabit.co is loaded REMOTELY inside the biblehabit-ios Capacitor
 * shell; the native bridge injects window.Capacitor into whatever page is
 * loaded regardless of what that page's own bundle imports).
 *
 * This module owns the client-side half of "never trust the client": every
 * transaction returned by purchase()/restore()/the update listener is
 * POSTed to /api/iap/verify before finishTransaction() is ever called.
 */

import { supabase } from "@/lib/supabase";

/** Bearer header for the signed-in Supabase session — the same convention every BibleHabit API route verifies. */
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface StoreProduct {
  id: string;
  displayName: string;
  description: string;
  price: number;
  displayPrice: string;
  currencyCode: string;
  subscriptionPeriod?: { unit: string; value: number };
  introOffer?: { type: string; periodUnit: string; periodValue: number; periodCount: number; displayPrice: string };
}

export type PurchaseOutcome =
  | { status: "success"; verified: true; tier: "plus" | "free" }
  | { status: "success"; verified: false; error: string }
  | { status: "userCancelled" }
  | { status: "pending" }
  | { status: "productUnavailable" }
  | { status: "verificationFailed"; error?: string }
  | { status: "networkError" }
  | { status: "notNative" }
  | { status: "unknown"; error?: string };

interface NativeTransaction {
  verified: boolean;
  signedTransactionInfo?: string;
  transactionId?: string;
  originalTransactionId?: string;
  productId: string;
  error?: string;
}

interface NativeStoreKit2 {
  getProducts(opts: { productIds: string[] }): Promise<{ products: StoreProduct[] }>;
  purchase(opts: { productId: string; appAccountToken?: string }): Promise<{
    status: string;
    transaction?: NativeTransaction;
    error?: string;
  }>;
  restorePurchases(): Promise<{ transactions: NativeTransaction[] }>;
  getCurrentEntitlements(): Promise<{ transactions: NativeTransaction[] }>;
  finishTransaction(opts: { transactionId: string }): Promise<{ finished: boolean }>;
  addListener(
    eventName: "transactionsUpdated",
    cb: (event: NativeTransaction) => void
  ): Promise<{ remove: () => void }>;
}

function nativeStoreKit(): NativeStoreKit2 | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, unknown> } }).Capacitor;
  return (cap?.Plugins?.StoreKit2 as NativeStoreKit2 | undefined) ?? null;
}

export function isStoreKitAvailable(): boolean {
  return !!nativeStoreKit();
}

async function verify(signedTransactionInfo: string): Promise<{ ok: boolean; tier?: "plus" | "free"; error?: string }> {
  try {
    const res = await fetch("/api/iap/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ signedTransactionInfo }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.ok) return { ok: true, tier: json.tier };
    return { ok: false, error: json.error || `verify failed (${res.status})` };
  } catch {
    return { ok: false, error: "Could not reach the server to verify your purchase." };
  }
}

let listenerAttached = false;
function ensureTransactionListener() {
  if (listenerAttached) return;
  const sk = nativeStoreKit();
  if (!sk) return;
  listenerAttached = true;
  sk.addListener("transactionsUpdated", async (t) => {
    if (!t?.verified || !t.signedTransactionInfo || !t.transactionId) return;
    const result = await verify(t.signedTransactionInfo);
    if (result.ok) {
      await sk.finishTransaction({ transactionId: t.transactionId }).catch(() => {});
    }
  }).catch(() => {});
}

export async function getStoreProducts(productIds: string[]): Promise<StoreProduct[]> {
  ensureTransactionListener();
  const sk = nativeStoreKit();
  if (!sk) return [];
  try {
    const { products } = await sk.getProducts({ productIds });
    return products;
  } catch {
    return [];
  }
}

/**
 * `userId` (the signed-in Supabase user's own uuid) is passed through as
 * StoreKit's appAccountToken so the server can attribute the transaction
 * without Apple ever sharing an email address.
 */
export async function purchaseProduct(productId: string, userId: string): Promise<PurchaseOutcome> {
  ensureTransactionListener();
  const sk = nativeStoreKit();
  if (!sk) return { status: "notNative" };

  let result: { status: string; transaction?: NativeTransaction; error?: string };
  try {
    result = await sk.purchase({ productId, appAccountToken: userId });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "NETWORK_ERROR") return { status: "networkError" };
    return { status: "unknown", error: err instanceof Error ? err.message : String(err) };
  }

  switch (result.status) {
    case "userCancelled":
      return { status: "userCancelled" };
    case "pending":
      return { status: "pending" };
    case "productUnavailable":
      return { status: "productUnavailable" };
    case "verificationFailed":
      return { status: "verificationFailed", error: result.error };
    case "success": {
      const tx = result.transaction;
      if (!tx?.signedTransactionInfo || !tx.transactionId) {
        return { status: "success", verified: false, error: "No signed transaction returned" };
      }
      const verdict = await verify(tx.signedTransactionInfo);
      if (verdict.ok) {
        await sk.finishTransaction({ transactionId: tx.transactionId }).catch(() => {});
        return { status: "success", verified: true, tier: verdict.tier ?? "plus" };
      }
      return { status: "success", verified: false, error: verdict.error ?? "Verification failed" };
    }
    default:
      return { status: "unknown", error: result.error };
  }
}

export interface RestoreOutcome {
  restoredCount: number;
  verifiedCount: number;
  tier: "plus" | "free" | null;
  networkError: boolean;
}

export async function restoreStorePurchases(): Promise<RestoreOutcome> {
  ensureTransactionListener();
  const sk = nativeStoreKit();
  if (!sk) return { restoredCount: 0, verifiedCount: 0, tier: null, networkError: false };

  let transactions: NativeTransaction[];
  try {
    const res = await sk.restorePurchases();
    transactions = res.transactions;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    return { restoredCount: 0, verifiedCount: 0, tier: null, networkError: code === "NETWORK_ERROR" };
  }

  let verifiedCount = 0;
  let tier: "plus" | "free" | null = null;
  for (const t of transactions) {
    if (!t.verified || !t.signedTransactionInfo || !t.transactionId) continue;
    const verdict = await verify(t.signedTransactionInfo);
    if (verdict.ok) {
      verifiedCount++;
      tier = verdict.tier ?? "plus";
      await sk.finishTransaction({ transactionId: t.transactionId }).catch(() => {});
    }
  }
  return { restoredCount: transactions.length, verifiedCount, tier, networkError: false };
}

/** Silent launch-time sync — no AppStore.sync() round trip. Safe to call on every app open. */
export async function syncAppleEntitlement(): Promise<void> {
  ensureTransactionListener();
  const sk = nativeStoreKit();
  if (!sk) return;
  try {
    const { transactions } = await sk.getCurrentEntitlements();
    for (const t of transactions) {
      if (!t.verified || !t.signedTransactionInfo || !t.transactionId) continue;
      const verdict = await verify(t.signedTransactionInfo);
      if (verdict.ok) await sk.finishTransaction({ transactionId: t.transactionId }).catch(() => {});
    }
  } catch {
    /* best-effort */
  }
}
