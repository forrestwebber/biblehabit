/**
 * Generate a full daily reading schedule from a predefined plan.
 * Returns an array of day objects with date and chapter references.
 */

import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  getGlobalChapterIndex,
  getBookAndChapter,
  chaptersRemaining,
} from "@/lib/bible-data";
import type { PredefinedPlan } from "@/lib/predefined-plans";

export interface ScheduleDay {
  day: number;
  date: string; // YYYY-MM-DD
  chapters: string[]; // e.g. ["Genesis 1", "Genesis 2", "Genesis 3"]
  summary: string; // e.g. "Genesis 1–3"
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Build a readable summary like "Genesis 1–3" or "Genesis 50 – Exodus 1"
 */
function buildSummary(chapters: string[]): string {
  if (chapters.length === 0) return "";
  if (chapters.length === 1) return chapters[0];

  const first = chapters[0];
  const last = chapters[chapters.length - 1];

  const [firstBook, firstCh] = splitRef(first);
  const [lastBook, lastCh] = splitRef(last);

  if (firstBook === lastBook) {
    return `${firstBook} ${firstCh}–${lastCh}`;
  }
  return `${firstBook} ${firstCh} – ${lastBook} ${lastCh}`;
}

function splitRef(ref: string): [string, string] {
  const lastSpace = ref.lastIndexOf(" ");
  return [ref.slice(0, lastSpace), ref.slice(lastSpace + 1)];
}

/**
 * Generate the full schedule for a plan.
 * If the plan specifies durationDays, we generate exactly that many days.
 * Chapters per day are adjusted to fit the plan's scope.
 */
export function generateSchedule(
  plan: PredefinedPlan,
  startDate: Date = new Date()
): ScheduleDay[] {
  const schedule: ScheduleDay[] = [];

  const startGlobal = getGlobalChapterIndex(plan.startBook, plan.startChapter);

  // Determine total chapters in scope
  let totalInScope: number;

  // For specific scoped plans (not whole Bible from Genesis 1)
  if (plan.slug === "psalms-proverbs") {
    // Psalms (150) + Proverbs (31) = 181 chapters
    totalInScope = 150 + 31;
  } else if (plan.slug === "gospels-30-days") {
    // Matthew (28) + Mark (16) + Luke (24) + John (21) = 89 chapters
    totalInScope = 28 + 16 + 24 + 21;
  } else if (plan.slug === "new-testament-90-days") {
    // NT total chapters
    totalInScope = BIBLE_BOOKS
      .filter((b) => b.testament === "NT")
      .reduce((sum, b) => sum + b.chapters, 0);
  } else if (plan.slug === "old-testament-9-months") {
    totalInScope = BIBLE_BOOKS
      .filter((b) => b.testament === "OT")
      .reduce((sum, b) => sum + b.chapters, 0);
  } else {
    // Whole Bible plans
    totalInScope = chaptersRemaining(plan.startBook, plan.startChapter);
  }

  // Distribute chapters evenly across the plan duration.
  // Some days get floor(total/days) chapters, others get ceil.
  const actualDays = Math.min(plan.durationDays, totalInScope);
  const basePerDay = Math.floor(totalInScope / actualDays);
  const extraDays = totalInScope - basePerDay * actualDays; // these days get basePerDay + 1

  let currentGlobal = startGlobal;
  const maxGlobal = startGlobal + totalInScope;

  for (let dayIdx = 0; dayIdx < actualDays; dayIdx++) {
    if (currentGlobal >= maxGlobal || currentGlobal >= TOTAL_CHAPTERS) break;

    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + dayIdx);

    // Spread the extra chapters across the first N days
    const todayCount = dayIdx < extraDays ? basePerDay + 1 : basePerDay;

    const chapters: string[] = [];
    const endGlobal = Math.min(
      currentGlobal + todayCount,
      maxGlobal,
      TOTAL_CHAPTERS
    );

    for (let g = currentGlobal; g < endGlobal; g++) {
      const { book, chapter } = getBookAndChapter(g);
      chapters.push(`${book} ${chapter}`);
    }

    if (chapters.length > 0) {
      schedule.push({
        day: dayIdx + 1,
        date: formatDate(dayDate),
        chapters,
        summary: buildSummary(chapters),
      });
    }

    currentGlobal = endGlobal;
  }

  return schedule;
}
