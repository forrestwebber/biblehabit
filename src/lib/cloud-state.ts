// Durable sync for the stores that used to live only in localStorage.
//
// Before this (found 2026-08-02): only the reading plan and reading_progress
// reached Supabase. Notes, highlights, sub-plans, XP and preferences existed
// solely on the device — a reinstall or a new phone silently destroyed every
// highlight and note a reader had ever made. Forrest: "is the app saving
// everyone's data as they go? ... nothing should be lost."
//
// Design: the client stores keep their exact localStorage shapes. This module
// mirrors those raw values into public.user_state (user_id, key, jsonb value),
// so no store had to be rewritten and nothing about the offline path changed.
//
// Conflict rule: last-write-wins per key, compared on updated_at. On sign-in we
// PULL first and only overwrite a local value when the remote one is newer than
// the local write we recorded — so a device that has been offline and edited
// keeps its work instead of being clobbered by a stale row.

import { supabase } from "./supabase";

/** Every localStorage key that must survive a reinstall. */
export const SYNCED_KEYS = [
  "bh-chapter-notes",          // notes-store
  "biblehabit_highlights",     // highlights-store
  "biblehabit_subplans",       // sub-plans
  "biblehabit_subplan_progress",
  "biblehabit_xp",             // xp-store
  "bh-reminder-time",          // prefs
  "bh-reminder-enabled",
  "biblehabit_translation",
  "bh-font-size",
] as const;

// Deliberately NOT synced: bh-entitlement-cache and bh-trial-started are local
// caches of server truth (re-derived from /api/entitlement), and syncing them
// would let a stale device resurrect an expired trial.

const STAMP_PREFIX = "bh-sync-at:";

function localStamp(key: string): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(STAMP_PREFIX + key) ?? 0);
}

function setLocalStamp(key: string, ms: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAMP_PREFIX + key, String(ms));
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Push one key's current localStorage value to the cloud.
 * Fire-and-forget: a failed sync must never block the UI or lose the local write.
 */
export async function pushKey(key: string): Promise<void> {
  if (typeof window === "undefined") return;
  const userId = await currentUserId();
  if (!userId) return; // signed out — the local copy is still authoritative
  const raw = localStorage.getItem(key);
  if (raw == null) return;

  // Store the raw string inside a wrapper so any shape (object, array, plain
  // string, number) round-trips byte-identically.
  const now = Date.now();
  const { error } = await supabase
    .from("user_state")
    .upsert(
      { user_id: userId, key, value: { raw }, updated_at: new Date(now).toISOString() },
      { onConflict: "user_id,key" }
    );
  if (error) {
    console.error("[cloud-state] push failed", key, error.message);
    return;
  }
  setLocalStamp(key, now);
}

/** Debounced push — stores call this on every write; bursts collapse to one round trip. */
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
export function queuePush(key: string, delayMs = 1200): void {
  if (typeof window === "undefined") return;
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => { void pushKey(key); }, delayMs);
}

/**
 * Pull every synced key for the signed-in user and merge into localStorage.
 * Returns the number of keys restored — the caller can re-read its stores.
 */
export async function pullAll(): Promise<number> {
  if (typeof window === "undefined") return 0;
  const userId = await currentUserId();
  if (!userId) return 0;

  const { data, error } = await supabase
    .from("user_state")
    .select("key, value, updated_at")
    .eq("user_id", userId);

  if (error) {
    console.error("[cloud-state] pull failed", error.message);
    return 0;
  }

  let restored = 0;
  for (const row of data ?? []) {
    const key = row.key as string;
    if (!(SYNCED_KEYS as readonly string[]).includes(key)) continue;
    const raw = (row.value as { raw?: string } | null)?.raw;
    if (typeof raw !== "string") continue;

    const remoteMs = new Date(row.updated_at as string).getTime();
    const localExists = localStorage.getItem(key) != null;

    // Take the remote copy when this device has nothing, or when the remote row
    // is newer than the last value this device successfully pushed.
    if (!localExists || remoteMs > localStamp(key)) {
      localStorage.setItem(key, raw);
      setLocalStamp(key, remoteMs);
      restored++;
    }
  }
  return restored;
}

/**
 * First sign-in on a device that already has local work (the common case for
 * anyone who used the app before creating an account): push anything the cloud
 * has never seen, so signing up never costs a reader their existing notes.
 */
export async function pushUnsynced(): Promise<void> {
  if (typeof window === "undefined") return;
  const userId = await currentUserId();
  if (!userId) return;
  for (const key of SYNCED_KEYS) {
    if (localStorage.getItem(key) != null && localStamp(key) === 0) {
      await pushKey(key);
    }
  }
}
