// Shared reading-time model — the single source of truth for "how long will this take?".
//
// Root-cause note (2026-08-02): the old /plans builder assumed 1 chapter ≈ 1 minute,
// so its default "30 min/day" wrote chaptersPerDay = 30 and a brand-new user's first
// day was Genesis 1–30 (~100 real minutes). Every pace/minutes calculation must go
// through this module instead.
//
// WORDS_PER_MINUTE matches the live-text estimate the Today screen uses.
export const WORDS_PER_MINUTE = 238;

// KJV average words per chapter, by section. Coarse but honest — derived from KJV
// word counts (~789,600 words across 1,189 chapters ≈ 664 words/chapter overall).
const AVG_WORDS_PSALMS = 285; // Psalms are short poems (~42,700 words / 150)
const AVG_WORDS_PROVERBS = 485; // ~15,000 words / 31
const AVG_WORDS_NT = 694; // ~180,500 words / 260
const AVG_WORDS_DEFAULT = 664; // whole-Bible average

const NT_BOOKS = new Set([
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
  "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
  "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy",
  "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation",
]);

export function avgChapterWords(book?: string): number {
  if (!book) return AVG_WORDS_DEFAULT;
  if (book === "Psalms") return AVG_WORDS_PSALMS;
  if (book === "Proverbs") return AVG_WORDS_PROVERBS;
  if (NT_BOOKS.has(book)) return AVG_WORDS_NT;
  return AVG_WORDS_DEFAULT;
}

/** Estimated minutes to read one chapter of `book` (fractional — round at display time). */
export function estimateChapterMinutes(book?: string): number {
  return avgChapterWords(book) / WORDS_PER_MINUTE;
}

/** Whole-number minutes/day for a plan reading `chaptersPerDay` starting in `startBook`. */
export function estimateDailyMinutes(startBook: string | undefined, chaptersPerDay: number): number {
  return Math.max(1, Math.round(estimateChapterMinutes(startBook) * chaptersPerDay));
}

/**
 * Convert a minutes-per-day budget into whole chapters per day.
 * An average Bible chapter takes ~2.8 minutes at 238 wpm, so 30 min/day ≈ 11 chapters —
 * NOT 30 (the legacy 1-min-per-chapter bug).
 */
export function chaptersForMinutes(minutesPerDay: number): number {
  return Math.max(1, Math.round(minutesPerDay / (AVG_WORDS_DEFAULT / WORDS_PER_MINUTE)));
}
