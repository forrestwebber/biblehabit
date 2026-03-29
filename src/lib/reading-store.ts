// localStorage-based reading plan & progress storage
// Will be migrated to Supabase when auth is fully wired

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

export function savePlan(plan: SavedPlan): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function getPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PLAN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getProgress(): ReadingProgress {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function markDayComplete(date: string, chapterIndices: number[]): void {
  if (typeof window === "undefined") return;
  const progress = getProgress();
  progress[date] = chapterIndices;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function isDayComplete(date: string): boolean {
  const progress = getProgress();
  return !!(progress[date] && progress[date].length > 0);
}

// Calculate current streak
export function getCurrentStreak(): number {
  const progress = getProgress();
  let streak = 0;
  const today = new Date();

  // Check if today is done
  const todayStr = formatDate(today);
  if (progress[todayStr] && progress[todayStr].length > 0) {
    streak = 1;
  }

  // Walk backwards
  const checkDate = new Date(today);
  if (streak === 0) {
    // If today not done, start from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = formatDate(checkDate);
    if (!(progress[yesterdayStr] && progress[yesterdayStr].length > 0)) {
      return 0;
    }
    streak = 1;
  }

  // Continue walking back
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

// Total chapters read
export function getTotalChaptersRead(): number {
  const progress = getProgress();
  let total = 0;
  for (const date in progress) {
    total += progress[date].length;
  }
  return total;
}

// Days with readings in a specific month
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
