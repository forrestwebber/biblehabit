/**
 * BibleHabit pacing engine — pure functions, no side effects, no I/O.
 *
 * Canonical 66-book / 1,189-chapter index (KJV chapter counts).
 * Sum verified: OT 929 + NT 260 = 1,189.
 */

export interface BibleBookIndex {
  name: string;
  chapters: number;
  testament: "OT" | "NT";
}

export const BIBLE_INDEX: BibleBookIndex[] = [
  { name: "Genesis", chapters: 50, testament: "OT" },
  { name: "Exodus", chapters: 40, testament: "OT" },
  { name: "Leviticus", chapters: 27, testament: "OT" },
  { name: "Numbers", chapters: 36, testament: "OT" },
  { name: "Deuteronomy", chapters: 34, testament: "OT" },
  { name: "Joshua", chapters: 24, testament: "OT" },
  { name: "Judges", chapters: 21, testament: "OT" },
  { name: "Ruth", chapters: 4, testament: "OT" },
  { name: "1 Samuel", chapters: 31, testament: "OT" },
  { name: "2 Samuel", chapters: 24, testament: "OT" },
  { name: "1 Kings", chapters: 22, testament: "OT" },
  { name: "2 Kings", chapters: 25, testament: "OT" },
  { name: "1 Chronicles", chapters: 29, testament: "OT" },
  { name: "2 Chronicles", chapters: 36, testament: "OT" },
  { name: "Ezra", chapters: 10, testament: "OT" },
  { name: "Nehemiah", chapters: 13, testament: "OT" },
  { name: "Esther", chapters: 10, testament: "OT" },
  { name: "Job", chapters: 42, testament: "OT" },
  { name: "Psalms", chapters: 150, testament: "OT" },
  { name: "Proverbs", chapters: 31, testament: "OT" },
  { name: "Ecclesiastes", chapters: 12, testament: "OT" },
  { name: "Song of Solomon", chapters: 8, testament: "OT" },
  { name: "Isaiah", chapters: 66, testament: "OT" },
  { name: "Jeremiah", chapters: 52, testament: "OT" },
  { name: "Lamentations", chapters: 5, testament: "OT" },
  { name: "Ezekiel", chapters: 48, testament: "OT" },
  { name: "Daniel", chapters: 12, testament: "OT" },
  { name: "Hosea", chapters: 14, testament: "OT" },
  { name: "Joel", chapters: 3, testament: "OT" },
  { name: "Amos", chapters: 9, testament: "OT" },
  { name: "Obadiah", chapters: 1, testament: "OT" },
  { name: "Jonah", chapters: 4, testament: "OT" },
  { name: "Micah", chapters: 7, testament: "OT" },
  { name: "Nahum", chapters: 3, testament: "OT" },
  { name: "Habakkuk", chapters: 3, testament: "OT" },
  { name: "Zephaniah", chapters: 3, testament: "OT" },
  { name: "Haggai", chapters: 2, testament: "OT" },
  { name: "Zechariah", chapters: 14, testament: "OT" },
  { name: "Malachi", chapters: 4, testament: "OT" },
  { name: "Matthew", chapters: 28, testament: "NT" },
  { name: "Mark", chapters: 16, testament: "NT" },
  { name: "Luke", chapters: 24, testament: "NT" },
  { name: "John", chapters: 21, testament: "NT" },
  { name: "Acts", chapters: 28, testament: "NT" },
  { name: "Romans", chapters: 16, testament: "NT" },
  { name: "1 Corinthians", chapters: 16, testament: "NT" },
  { name: "2 Corinthians", chapters: 13, testament: "NT" },
  { name: "Galatians", chapters: 6, testament: "NT" },
  { name: "Ephesians", chapters: 6, testament: "NT" },
  { name: "Philippians", chapters: 4, testament: "NT" },
  { name: "Colossians", chapters: 4, testament: "NT" },
  { name: "1 Thessalonians", chapters: 5, testament: "NT" },
  { name: "2 Thessalonians", chapters: 3, testament: "NT" },
  { name: "1 Timothy", chapters: 6, testament: "NT" },
  { name: "2 Timothy", chapters: 4, testament: "NT" },
  { name: "Titus", chapters: 3, testament: "NT" },
  { name: "Philemon", chapters: 1, testament: "NT" },
  { name: "Hebrews", chapters: 13, testament: "NT" },
  { name: "James", chapters: 5, testament: "NT" },
  { name: "1 Peter", chapters: 5, testament: "NT" },
  { name: "2 Peter", chapters: 3, testament: "NT" },
  { name: "1 John", chapters: 5, testament: "NT" },
  { name: "2 John", chapters: 1, testament: "NT" },
  { name: "3 John", chapters: 1, testament: "NT" },
  { name: "Jude", chapters: 1, testament: "NT" },
  { name: "Revelation", chapters: 22, testament: "NT" },
];

export const TOTAL_CHAPTERS = BIBLE_INDEX.reduce((sum, b) => sum + b.chapters, 0);

/** Convert a (book, chapter) position into a 1-indexed global chapter position (1..1189). */
export function positionToChapterIndex(book: string, chapter: number): number {
  let idx = 0;
  for (const b of BIBLE_INDEX) {
    if (b.name === book) {
      if (chapter < 1 || chapter > b.chapters) {
        throw new Error(`Invalid chapter ${chapter} for ${book} (has ${b.chapters} chapters)`);
      }
      return idx + chapter;
    }
    idx += b.chapters;
  }
  throw new Error(`Unknown book: ${book}`);
}

/** Convert a 1-indexed global chapter position back into (book, chapter). */
export function chapterIndexToPosition(globalIndex: number): { book: string; chapter: number } {
  if (globalIndex < 1 || globalIndex > TOTAL_CHAPTERS) {
    throw new Error(`Global index ${globalIndex} out of range 1..${TOTAL_CHAPTERS}`);
  }
  let remaining = globalIndex;
  for (const b of BIBLE_INDEX) {
    if (remaining <= b.chapters) {
      return { book: b.name, chapter: remaining };
    }
    remaining -= b.chapters;
  }
  throw new Error("unreachable");
}

export interface ReadingHistoryPoint {
  /** ISO date string */
  date: string;
  /** global chapter index reached as of this date */
  chapterIndex: number;
}

export interface PaceResult {
  chaptersPerDay: number;
  daysObserved: number;
}

/**
 * Compute observed reading pace (chapters/day) from a history of reading_positions
 * records, sorted or unsorted. Uses earliest and latest points.
 * Falls back to a gentle default (1 chapter/day) if there's not enough history.
 */
export function computePace(history: ReadingHistoryPoint[]): PaceResult {
  if (history.length < 2) {
    return { chaptersPerDay: 1, daysObserved: 0 };
  }
  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = Math.max(
    1,
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86_400_000
  );
  const chapters = Math.max(0, last.chapterIndex - first.chapterIndex);
  const chaptersPerDay = chapters / days;
  return {
    chaptersPerDay: chaptersPerDay > 0 ? chaptersPerDay : 1,
    daysObserved: Math.round(days),
  };
}

/**
 * Project the finish date for the whole Bible (or remaining chapters) given a
 * current global position and a steady chaptersPerDay pace.
 */
export function projectFinishDate(
  currentChapterIndex: number,
  chaptersPerDay: number,
  fromDate: Date = new Date()
): Date {
  const remaining = Math.max(0, TOTAL_CHAPTERS - currentChapterIndex);
  const daysNeeded = chaptersPerDay > 0 ? Math.ceil(remaining / chaptersPerDay) : Infinity;
  const finish = new Date(fromDate);
  finish.setDate(finish.getDate() + daysNeeded);
  return finish;
}

/**
 * Given a current position and a target finish date, compute the daily chapter
 * load required to hit that date.
 */
export function requiredDailyLoad(
  currentChapterIndex: number,
  targetDate: Date,
  fromDate: Date = new Date()
): number {
  const remaining = Math.max(0, TOTAL_CHAPTERS - currentChapterIndex);
  const daysLeft = Math.max(
    1,
    Math.ceil((targetDate.getTime() - fromDate.getTime()) / 86_400_000)
  );
  return remaining / daysLeft;
}

export interface PaceStatus {
  /** positive = ahead of pace, negative = behind, 0 = on pace */
  daysAheadOrBehind: number;
  label: "ahead" | "behind" | "on-pace";
  /** kind, shame-free message */
  message: string;
}

/**
 * Compare actual progress against an expected chapters/day plan pace to produce
 * a kind, non-judgmental status. Never uses guilt language.
 */
export function evaluatePaceStatus(
  currentChapterIndex: number,
  startChapterIndex: number,
  planStartDate: Date,
  planChaptersPerDay: number,
  today: Date = new Date()
): PaceStatus {
  const daysElapsed = Math.max(
    0,
    (today.getTime() - planStartDate.getTime()) / 86_400_000
  );
  const expectedIndex = startChapterIndex + planChaptersPerDay * daysElapsed;
  const chapterDelta = currentChapterIndex - expectedIndex;
  const daysAheadOrBehind =
    planChaptersPerDay > 0 ? Math.round(chapterDelta / planChaptersPerDay) : 0;

  if (daysAheadOrBehind > 0) {
    return {
      daysAheadOrBehind,
      label: "ahead",
      message: `You're ${daysAheadOrBehind} day${daysAheadOrBehind === 1 ? "" : "s"} ahead of pace.`,
    };
  }
  if (daysAheadOrBehind < 0) {
    const behind = Math.abs(daysAheadOrBehind);
    return {
      daysAheadOrBehind,
      label: "behind",
      message: `Life happens — you're about ${behind} day${behind === 1 ? "" : "s"} behind. Here's a gentle new pace to pick back up.`,
    };
  }
  return { daysAheadOrBehind: 0, label: "on-pace", message: "You're right on pace." };
}

export interface ReflowResult {
  newChaptersPerDay: number;
  newFinishDate: Date;
  message: string;
}

/**
 * Recalculate a plan after missed days (or any pace change) with NO shame or
 * guilt language — always forward-looking and encouraging.
 */
export function reflowPlan(
  currentChapterIndex: number,
  targetDate: Date,
  fromDate: Date = new Date()
): ReflowResult {
  const newChaptersPerDay = requiredDailyLoad(currentChapterIndex, targetDate, fromDate);
  const newFinishDate = projectFinishDate(currentChapterIndex, newChaptersPerDay, fromDate);
  const rounded = Math.round(newChaptersPerDay * 10) / 10;
  return {
    newChaptersPerDay: rounded,
    newFinishDate,
    message: `Here's your fresh pace: about ${rounded} chapter${rounded === 1 ? "" : "s"}/day gets you there. Pick up right where you are — no catching up required.`,
  };
}

export interface GoalSuggestion {
  id: "finish-by-date" | "year-plan" | "habit-bundle";
  type: "destination" | "habit";
  title: string;
  description: string;
  dailyLoad?: number;
  targetDate?: Date;
  dailyComponents?: { label: string; description: string }[];
}

/**
 * Suggest exactly 3 goal options from a reader's current position and observed pace:
 *  (a) finish-by-date at their own observed pace
 *  (b) whole-Bible-in-a-year from current position
 *  (c) a habit bundle: Psalm + Proverb + NT chapter per day
 */
export function suggestGoals(
  currentChapterIndex: number,
  observedChaptersPerDay: number,
  fromDate: Date = new Date()
): [GoalSuggestion, GoalSuggestion, GoalSuggestion] {
  const pace = observedChaptersPerDay > 0 ? observedChaptersPerDay : 1;
  const finishAtOwnPace = projectFinishDate(currentChapterIndex, pace, fromDate);

  const yearTarget = new Date(fromDate);
  yearTarget.setDate(yearTarget.getDate() + 365);
  const yearDailyLoad =
    Math.round(requiredDailyLoad(currentChapterIndex, yearTarget, fromDate) * 10) / 10;

  return [
    {
      id: "finish-by-date",
      type: "destination",
      title: "Keep your current pace",
      description: `At about ${Math.round(pace * 10) / 10} chapters/day, you'll finish the Bible around ${finishAtOwnPace.toDateString()}.`,
      dailyLoad: Math.round(pace * 10) / 10,
      targetDate: finishAtOwnPace,
    },
    {
      id: "year-plan",
      type: "destination",
      title: "Finish the Bible in a year",
      description: `About ${yearDailyLoad} chapters/day from where you are now gets you through the whole Bible in 365 days.`,
      dailyLoad: yearDailyLoad,
      targetDate: yearTarget,
    },
    {
      id: "habit-bundle",
      type: "habit",
      title: "A daily habit, not a deadline",
      description: "One Psalm, one Proverb, and one New Testament chapter each day — no finish line, just a rhythm.",
      dailyComponents: [
        { label: "Psalm", description: "One Psalm a day" },
        { label: "Proverb", description: "One Proverb a day" },
        { label: "NT", description: "One New Testament chapter a day" },
      ],
    },
  ];
}
