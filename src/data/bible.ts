/**
 * Canonical Bible data — all 66 books with chapter counts.
 * Re-exports everything from @/lib/bible-data for convenience.
 *
 * Use this file as the single source of truth for Bible structure.
 * The reading plan calculator, daily reading page, and progress
 * tracker all depend on this data.
 */

export {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  getGlobalChapterIndex,
  getBookAndChapter,
  chaptersRemaining,
  calculatePlan,
  getTodaysReading,
  getMilestones,
} from "@/lib/bible-data";

export type { BibleBook, ReadingPlan } from "@/lib/bible-data";
