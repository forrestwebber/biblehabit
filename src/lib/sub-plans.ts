// Sub-plans: supplementary daily readings (Psalms, Proverbs, John, etc.)
// Each sub-plan cycles through a single book one chapter per day.

export interface SubPlan {
  id: string;
  label: string;       // "Daily Psalm", "Daily Proverb", "Gospel of John"
  book: string;        // Bible book name
  totalChapters: number;
  chaptersPerDay: number;
  startDate: string;   // YYYY-MM-DD
  paused: boolean;
  pausedAt?: string;   // YYYY-MM-DD
  pausedChapter?: number;
  createdAt: string;
}

const SUBPLANS_KEY = "biblehabit_subplans";
const SUBPLAN_PROGRESS_KEY = "biblehabit_subplan_progress";

// Map of book name → total chapters (for cycle sub-plans)
const BOOK_CHAPTERS: Record<string, number> = {
  Psalms: 150, Proverbs: 31, John: 21, Matthew: 28, Mark: 16, Luke: 24,
  Romans: 16, James: 5, Revelation: 22, Genesis: 50, "1 Corinthians": 16,
  Ephesians: 6, Philippians: 4, Colossians: 4, Hebrews: 13,
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.max(0, Math.floor((db.getTime() - da.getTime()) / 86400000));
}

// ─── Storage ─────────────────────────────────────────────────────

export function getSubPlans(): SubPlan[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SUBPLANS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSubPlans(plans: SubPlan[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUBPLANS_KEY, JSON.stringify(plans));
}

function getProgress(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SUBPLAN_PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveProgress(p: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUBPLAN_PROGRESS_KEY, JSON.stringify(p));
}

// ─── CRUD ────────────────────────────────────────────────────────

export function addSubPlan(plan: Omit<SubPlan, "id" | "createdAt" | "paused">): SubPlan {
  const full: SubPlan = {
    ...plan,
    id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    paused: false,
    createdAt: today(),
  };
  const plans = getSubPlans();
  plans.push(full);
  saveSubPlans(plans);
  return full;
}

export function pauseSubPlan(id: string): void {
  const plans = getSubPlans().map((p) =>
    p.id === id
      ? { ...p, paused: true, pausedAt: today(), pausedChapter: getSubPlanChapterToday(p) }
      : p
  );
  saveSubPlans(plans);
}

export function resumeSubPlan(id: string): void {
  const plans = getSubPlans().map((p) =>
    p.id === id
      ? { ...p, paused: false, startDate: today(), pausedAt: undefined }
      : p
  );
  saveSubPlans(plans);
}

export function removeSubPlan(id: string): void {
  saveSubPlans(getSubPlans().filter((p) => p.id !== id));
}

// ─── Chapter calculation ─────────────────────────────────────────

/** Which chapter to read today for a given sub-plan (cycles). */
export function getSubPlanChapterToday(plan: SubPlan): number {
  const days = daysBetween(plan.startDate, today());
  return (days % plan.totalChapters) + 1;
}

// ─── Progress ────────────────────────────────────────────────────

export function markSubPlanDone(planId: string): void {
  const progress = getProgress();
  const todayStr = today();
  if (!progress[planId]) progress[planId] = [];
  if (!progress[planId].includes(todayStr)) {
    progress[planId].push(todayStr);
  }
  saveProgress(progress);
}

export function isSubPlanDoneToday(planId: string): boolean {
  const progress = getProgress();
  return !!(progress[planId]?.includes(today()));
}

export function getSubPlanStreak(planId: string): number {
  const progress = getProgress();
  const dates = progress[planId] || [];
  const dateSet = new Set(dates);
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  // Check today first
  const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  if (!dateSet.has(todayStr)) {
    d.setDate(d.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if (dateSet.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── Presets ─────────────────────────────────────────────────────

export const DEVOTIONAL_PRESETS = [
  {
    id: "psalms",
    label: "Daily Psalm",
    book: "Psalms",
    totalChapters: 150,
    chaptersPerDay: 1,
    desc: "One Psalm per day. Finishes in 5 months, then cycles.",
    emoji: "🎵",
  },
  {
    id: "proverbs",
    label: "Daily Proverb",
    book: "Proverbs",
    totalChapters: 31,
    chaptersPerDay: 1,
    desc: "One chapter of Proverbs per day. Cycles monthly.",
    emoji: "🦉",
  },
  {
    id: "john",
    label: "Gospel of John",
    book: "John",
    totalChapters: 21,
    chaptersPerDay: 1,
    desc: "Read the Gospel of John over 21 days, then start a new plan.",
    emoji: "✝️",
  },
  {
    id: "matthew",
    label: "Gospel of Matthew",
    book: "Matthew",
    totalChapters: 28,
    chaptersPerDay: 1,
    desc: "Read Matthew over 28 days.",
    emoji: "📖",
  },
];

export function getBookTotalChapters(book: string): number {
  return BOOK_CHAPTERS[book] ?? 1;
}
