// Reading plan & progress storage
// Uses localStorage as cache/fallback, syncs to Supabase when user is logged in

import { supabase } from "./supabase";
import { getBookAndChapter, getGlobalChapterIndex } from "@/data/bible";

export interface SavedPlan {
  startBook: string;
  startChapter: number;
  chaptersPerDay: number;
  startDate: string; // ISO date
  createdAt: string;
}

export interface ReadingProgress {
  // Key: "YYYY-MM-DD", value: array of completed global chapter indices
  [date: string]: number[];
}

const PLAN_KEY = "biblehabit_plan";
const PROGRESS_KEY = "biblehabit_progress";

// ─── Auth helpers ────────────────────────────────────────────────

async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ─── localStorage helpers (always available) ─────────────────────

function localGetPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PLAN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function localSavePlan(plan: SavedPlan): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

function localGetProgress(): ReadingProgress {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function localSaveProgress(progress: ReadingProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// ─── Supabase helpers ────────────────────────────────────────────

/** Convert Supabase reading_progress rows to our local ReadingProgress map */
function rowsToProgress(
  rows: { date: string; book: string; chapter: number }[]
): ReadingProgress {
  const progress: ReadingProgress = {};
  for (const row of rows) {
    const dateStr = row.date; // already "YYYY-MM-DD" from Supabase
    const globalIdx = getGlobalChapterIndex(row.book, row.chapter);
    if (!progress[dateStr]) progress[dateStr] = [];
    if (!progress[dateStr].includes(globalIdx)) {
      progress[dateStr].push(globalIdx);
    }
  }
  // Sort each day's indices for consistency
  for (const dateStr in progress) {
    progress[dateStr].sort((a, b) => a - b);
  }
  return progress;
}

/** Merge two ReadingProgress maps — union of chapter indices per date */
function mergeProgress(
  a: ReadingProgress,
  b: ReadingProgress
): ReadingProgress {
  const merged: ReadingProgress = {};
  const allDates = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const date of allDates) {
    const setA = new Set(a[date] || []);
    const setB = new Set(b[date] || []);
    const union = [...new Set([...setA, ...setB])].sort((x, y) => x - y);
    if (union.length > 0) merged[date] = union;
  }
  return merged;
}

/** Push local progress entries to Supabase (upsert) */
async function pushProgressToSupabase(
  userId: string,
  progress: ReadingProgress
): Promise<void> {
  const rows: { user_id: string; date: string; book: string; chapter: number; completed: boolean }[] = [];
  for (const dateStr in progress) {
    for (const globalIdx of progress[dateStr]) {
      const { book, chapter } = getBookAndChapter(globalIdx);
      rows.push({
        user_id: userId,
        date: dateStr,
        book,
        chapter,
        completed: true,
      });
    }
  }
  if (rows.length === 0) return;
  // Upsert in batches of 500 to stay within Supabase limits
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await supabase
      .from("reading_progress")
      .upsert(batch, { onConflict: "user_id,date,book,chapter" });
  }
}

/** Push plan to Supabase profile */
async function pushPlanToSupabase(
  userId: string,
  plan: SavedPlan
): Promise<void> {
  await supabase
    .from("profiles")
    .update({
      plan_id: `${plan.startBook}-${plan.startChapter}`,
      plan_start_date: plan.startDate,
      chapters_per_day: plan.chaptersPerDay,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

// ─── Public API ──────────────────────────────────────────────────

export function savePlan(plan: SavedPlan): void {
  localSavePlan(plan);
  // Fire-and-forget Supabase sync
  getUser().then((user) => {
    if (user) pushPlanToSupabase(user.id, plan);
  });
}

export function getPlan(): SavedPlan | null {
  return localGetPlan();
}

export function getProgress(): ReadingProgress {
  return localGetProgress();
}

export function markDayComplete(date: string, chapterIndices: number[]): void {
  if (typeof window === "undefined") return;
  const progress = localGetProgress();
  // Merge with any existing entries for that date
  const existing = new Set(progress[date] || []);
  for (const idx of chapterIndices) existing.add(idx);
  progress[date] = [...existing].sort((a, b) => a - b);
  localSaveProgress(progress);

  // Fire-and-forget Supabase sync
  getUser().then((user) => {
    if (!user) return;
    const rows = chapterIndices.map((globalIdx) => {
      const { book, chapter } = getBookAndChapter(globalIdx);
      return {
        user_id: user.id,
        date,
        book,
        chapter,
        completed: true,
      };
    });
    supabase
      .from("reading_progress")
      .upsert(rows, { onConflict: "user_id,date,book,chapter" })
      .then(({ error }) => {
        if (error) console.error("[reading-store] Supabase upsert error:", error);
      });
  });
}

export function isDayComplete(date: string): boolean {
  const progress = getProgress();
  return !!(progress[date] && progress[date].length > 0);
}

/**
 * Sync reading progress between localStorage and Supabase.
 * Call this on page load / auth state change.
 * If user is not logged in, this is a no-op.
 */
export async function syncProgress(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  // 1. Fetch all progress from Supabase
  const { data: rows, error } = await supabase
    .from("reading_progress")
    .select("date, book, chapter")
    .eq("user_id", user.id);

  if (error) {
    console.error("[reading-store] Failed to fetch Supabase progress:", error);
    return;
  }

  const remoteProgress = rowsToProgress(rows || []);
  const localProgress = localGetProgress();

  // 2. Merge local + remote (union)
  const merged = mergeProgress(localProgress, remoteProgress);

  // 3. Update localStorage with merged data
  localSaveProgress(merged);

  // 4. Push any entries that were only in local to Supabase
  //    (find dates/indices in local but not remote)
  const localOnly: ReadingProgress = {};
  for (const date in merged) {
    const remoteSet = new Set(remoteProgress[date] || []);
    const missing = merged[date].filter((idx) => !remoteSet.has(idx));
    if (missing.length > 0) localOnly[date] = missing;
  }
  if (Object.keys(localOnly).length > 0) {
    await pushProgressToSupabase(user.id, localOnly);
  }

  // 5. Sync plan to Supabase profile if local plan exists
  const plan = localGetPlan();
  if (plan) {
    await pushPlanToSupabase(user.id, plan);
  }
}

// ─── Statistics (unchanged, read from localStorage cache) ────────

export function getCurrentStreak(): number {
  const progress = getProgress();
  let streak = 0;
  const today = new Date();

  const todayStr = formatDate(today);
  if (progress[todayStr] && progress[todayStr].length > 0) {
    streak = 1;
  }

  const checkDate = new Date(today);
  if (streak === 0) {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = formatDate(checkDate);
    if (!(progress[yesterdayStr] && progress[yesterdayStr].length > 0)) {
      return 0;
    }
    streak = 1;
  }

  for (let i = 0; i < 365; i++) {
    checkDate.setDate(checkDate.getDate() - 1);
    const dateStr = formatDate(checkDate);
    if (progress[dateStr] && progress[dateStr].length > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getTotalChaptersRead(): number {
  const progress = getProgress();
  let total = 0;
  for (const date in progress) {
    total += progress[date].length;
  }
  return total;
}

export function getMonthReadings(year: number, month: number): Set<number> {
  const progress = getProgress();
  const days = new Set<number>();
  for (const dateStr in progress) {
    if (progress[dateStr].length > 0) {
      const [y, m, d] = dateStr.split("-").map(Number);
      if (y === year && m === month) {
        days.add(d);
      }
    }
  }
  return days;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export { formatDate };
