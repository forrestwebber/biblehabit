/**
 * reading-plan.js — Core reading plan logic for BibleHabit (plain CommonJS)
 * Ported from bible-data.ts + schedule-generator.ts + predefined-plans.ts
 * Usable with vanilla Node.js — no TypeScript, no build step required.
 */

// ─── Bible Data ────────────────────────────────────────────────────────────────

const BIBLE_BOOKS = [
  // Old Testament
  { name: "Genesis",          chapters: 50,  testament: "OT" },
  { name: "Exodus",           chapters: 40,  testament: "OT" },
  { name: "Leviticus",        chapters: 27,  testament: "OT" },
  { name: "Numbers",          chapters: 36,  testament: "OT" },
  { name: "Deuteronomy",      chapters: 34,  testament: "OT" },
  { name: "Joshua",           chapters: 24,  testament: "OT" },
  { name: "Judges",           chapters: 21,  testament: "OT" },
  { name: "Ruth",             chapters: 4,   testament: "OT" },
  { name: "1 Samuel",         chapters: 31,  testament: "OT" },
  { name: "2 Samuel",         chapters: 24,  testament: "OT" },
  { name: "1 Kings",          chapters: 22,  testament: "OT" },
  { name: "2 Kings",          chapters: 25,  testament: "OT" },
  { name: "1 Chronicles",     chapters: 29,  testament: "OT" },
  { name: "2 Chronicles",     chapters: 36,  testament: "OT" },
  { name: "Ezra",             chapters: 10,  testament: "OT" },
  { name: "Nehemiah",         chapters: 13,  testament: "OT" },
  { name: "Esther",           chapters: 10,  testament: "OT" },
  { name: "Job",              chapters: 42,  testament: "OT" },
  { name: "Psalms",           chapters: 150, testament: "OT" },
  { name: "Proverbs",         chapters: 31,  testament: "OT" },
  { name: "Ecclesiastes",     chapters: 12,  testament: "OT" },
  { name: "Song of Solomon",  chapters: 8,   testament: "OT" },
  { name: "Isaiah",           chapters: 66,  testament: "OT" },
  { name: "Jeremiah",         chapters: 52,  testament: "OT" },
  { name: "Lamentations",     chapters: 5,   testament: "OT" },
  { name: "Ezekiel",          chapters: 48,  testament: "OT" },
  { name: "Daniel",           chapters: 12,  testament: "OT" },
  { name: "Hosea",            chapters: 14,  testament: "OT" },
  { name: "Joel",             chapters: 3,   testament: "OT" },
  { name: "Amos",             chapters: 9,   testament: "OT" },
  { name: "Obadiah",          chapters: 1,   testament: "OT" },
  { name: "Jonah",            chapters: 4,   testament: "OT" },
  { name: "Micah",            chapters: 7,   testament: "OT" },
  { name: "Nahum",            chapters: 3,   testament: "OT" },
  { name: "Habakkuk",         chapters: 3,   testament: "OT" },
  { name: "Zephaniah",        chapters: 3,   testament: "OT" },
  { name: "Haggai",           chapters: 2,   testament: "OT" },
  { name: "Zechariah",        chapters: 14,  testament: "OT" },
  { name: "Malachi",          chapters: 4,   testament: "OT" },
  // New Testament
  { name: "Matthew",          chapters: 28,  testament: "NT" },
  { name: "Mark",             chapters: 16,  testament: "NT" },
  { name: "Luke",             chapters: 24,  testament: "NT" },
  { name: "John",             chapters: 21,  testament: "NT" },
  { name: "Acts",             chapters: 28,  testament: "NT" },
  { name: "Romans",           chapters: 16,  testament: "NT" },
  { name: "1 Corinthians",    chapters: 16,  testament: "NT" },
  { name: "2 Corinthians",    chapters: 13,  testament: "NT" },
  { name: "Galatians",        chapters: 6,   testament: "NT" },
  { name: "Ephesians",        chapters: 6,   testament: "NT" },
  { name: "Philippians",      chapters: 4,   testament: "NT" },
  { name: "Colossians",       chapters: 4,   testament: "NT" },
  { name: "1 Thessalonians",  chapters: 5,   testament: "NT" },
  { name: "2 Thessalonians",  chapters: 3,   testament: "NT" },
  { name: "1 Timothy",        chapters: 6,   testament: "NT" },
  { name: "2 Timothy",        chapters: 4,   testament: "NT" },
  { name: "Titus",            chapters: 3,   testament: "NT" },
  { name: "Philemon",         chapters: 1,   testament: "NT" },
  { name: "Hebrews",          chapters: 13,  testament: "NT" },
  { name: "James",            chapters: 5,   testament: "NT" },
  { name: "1 Peter",          chapters: 5,   testament: "NT" },
  { name: "2 Peter",          chapters: 3,   testament: "NT" },
  { name: "1 John",           chapters: 5,   testament: "NT" },
  { name: "2 John",           chapters: 1,   testament: "NT" },
  { name: "3 John",           chapters: 1,   testament: "NT" },
  { name: "Jude",             chapters: 1,   testament: "NT" },
  { name: "Revelation",       chapters: 22,  testament: "NT" },
];

const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0); // 1189

/**
 * Convert a book name + chapter number to a global chapter index (0-based).
 * Genesis 1 → 0, Genesis 50 → 49, Exodus 1 → 50, ...
 */
function getGlobalChapterIndex(bookName, chapter) {
  let index = 0;
  for (const book of BIBLE_BOOKS) {
    if (book.name === bookName) {
      return index + chapter - 1;
    }
    index += book.chapters;
  }
  return 0;
}

/**
 * Convert a global chapter index back to { book, chapter }.
 */
function getBookAndChapter(globalIndex) {
  let running = 0;
  for (const book of BIBLE_BOOKS) {
    if (globalIndex < running + book.chapters) {
      return { book: book.name, chapter: globalIndex - running + 1 };
    }
    running += book.chapters;
  }
  return { book: "Revelation", chapter: 22 };
}

/**
 * Total chapters remaining from a given start point to end of Bible.
 */
function chaptersRemaining(bookName, chapter) {
  const startIndex = getGlobalChapterIndex(bookName, chapter);
  return TOTAL_CHAPTERS - startIndex;
}

// ─── Predefined Plans ──────────────────────────────────────────────────────────

const PREDEFINED_PLANS = [
  {
    id: 1,
    slug: "whole-bible-1-year",
    title: "Read the Whole Bible in 1 Year",
    description: "Cover all 1,189 chapters in 365 days — about 3–4 chapters per day.",
    chaptersPerDay: 4,
    durationDays: 365,
    startBook: "Genesis",
    startChapter: 1,
    category: "whole-bible",
  },
  {
    id: 2,
    slug: "new-testament-90-days",
    title: "New Testament in 90 Days",
    description: "Read the entire New Testament in 90 days — about 3 chapters per day.",
    chaptersPerDay: 3,
    durationDays: 90,
    startBook: "Matthew",
    startChapter: 1,
    category: "new-testament",
  },
  {
    id: 3,
    slug: "whole-bible-2-years",
    title: "Read the Whole Bible in 2 Years",
    description: "A gentle pace through the entire Bible — about 2 chapters per day.",
    chaptersPerDay: 2,
    durationDays: 730,
    startBook: "Genesis",
    startChapter: 1,
    category: "whole-bible",
  },
  {
    id: 4,
    slug: "psalms-proverbs",
    title: "Psalms & Proverbs in 6 Months",
    description: "1 chapter per day through Psalms and Proverbs.",
    chaptersPerDay: 1,
    durationDays: 181,
    startBook: "Psalms",
    startChapter: 1,
    category: "topical",
  },
  {
    id: 5,
    slug: "gospels-30-days",
    title: "The Four Gospels in 30 Days",
    description: "Walk with Jesus through Matthew, Mark, Luke, and John.",
    chaptersPerDay: 3,
    durationDays: 30,
    startBook: "Matthew",
    startChapter: 1,
    category: "new-testament",
  },
  {
    id: 6,
    slug: "old-testament-9-months",
    title: "Old Testament in 9 Months",
    description: "Cover the entire Old Testament in 270 days — about 3 chapters per day.",
    chaptersPerDay: 3,
    durationDays: 270,
    startBook: "Genesis",
    startChapter: 1,
    category: "old-testament",
  },
];

function getPlanById(id) {
  return PREDEFINED_PLANS.find((p) => p.id === id);
}

function getPlanBySlug(slug) {
  return PREDEFINED_PLANS.find((p) => p.slug === slug);
}

// ─── Schedule Generator ────────────────────────────────────────────────────────

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildSummary(chapters) {
  if (chapters.length === 0) return "";
  if (chapters.length === 1) return chapters[0];
  const first = chapters[0];
  const last = chapters[chapters.length - 1];
  const lastSpaceF = first.lastIndexOf(" ");
  const lastSpaceL = last.lastIndexOf(" ");
  const firstBook = first.slice(0, lastSpaceF);
  const firstCh = first.slice(lastSpaceF + 1);
  const lastBook = last.slice(0, lastSpaceL);
  const lastCh = last.slice(lastSpaceL + 1);
  if (firstBook === lastBook) return `${firstBook} ${firstCh}–${lastCh}`;
  return `${firstBook} ${firstCh} – ${lastBook} ${lastCh}`;
}

/**
 * Generate a full daily reading schedule for a given plan.
 * @param {object} plan - a plan object from PREDEFINED_PLANS or a custom plan
 * @param {Date}   startDate - when the plan begins
 * @returns {Array<{day, date, chapters, summary}>}
 */
function generateSchedule(plan, startDate = new Date()) {
  const schedule = [];
  const startGlobal = getGlobalChapterIndex(plan.startBook, plan.startChapter);

  // Determine total chapters in scope for each plan type
  let totalInScope;
  if (plan.slug === "psalms-proverbs") {
    totalInScope = 150 + 31; // 181
  } else if (plan.slug === "gospels-30-days") {
    totalInScope = 28 + 16 + 24 + 21; // 89
  } else if (plan.slug === "new-testament-90-days") {
    totalInScope = BIBLE_BOOKS
      .filter((b) => b.testament === "NT")
      .reduce((sum, b) => sum + b.chapters, 0);
  } else if (plan.slug === "old-testament-9-months") {
    totalInScope = BIBLE_BOOKS
      .filter((b) => b.testament === "OT")
      .reduce((sum, b) => sum + b.chapters, 0);
  } else if (plan.endBook) {
    // Custom range plan: count chapters from startBook to endBook (inclusive)
    const startIdx = BIBLE_BOOKS.findIndex((b) => b.name === plan.startBook);
    const endIdx = BIBLE_BOOKS.findIndex((b) => b.name === plan.endBook);
    totalInScope = 0;
    for (let i = startIdx; i <= endIdx; i++) {
      totalInScope += BIBLE_BOOKS[i].chapters;
    }
    // Adjust for start chapter offset
    totalInScope -= (plan.startChapter - 1);
  } else {
    // Whole Bible / default: everything from start point to Revelation 22
    totalInScope = chaptersRemaining(plan.startBook, plan.startChapter);
  }

  const actualDays = Math.min(plan.durationDays, totalInScope);
  const basePerDay = Math.floor(totalInScope / actualDays);
  const extraDays = totalInScope - basePerDay * actualDays;

  let currentGlobal = startGlobal;
  const maxGlobal = startGlobal + totalInScope;

  for (let dayIdx = 0; dayIdx < actualDays; dayIdx++) {
    if (currentGlobal >= maxGlobal || currentGlobal >= TOTAL_CHAPTERS) break;

    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + dayIdx);

    const todayCount = dayIdx < extraDays ? basePerDay + 1 : basePerDay;
    const chapters = [];
    const endGlobal = Math.min(currentGlobal + todayCount, maxGlobal, TOTAL_CHAPTERS);

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

/**
 * Calculate a simple reading plan (range-based, no full schedule array).
 * chaptersPerDay = minutesPerDay (1 chapter ≈ 1 min reading).
 */
function calculateRange(startBookName, endBookName, minutesPerDay, startDate = new Date()) {
  const startIdx = BIBLE_BOOKS.findIndex((b) => b.name === startBookName);
  const endIdx = BIBLE_BOOKS.findIndex((b) => b.name === endBookName);

  if (startIdx === -1 || endIdx === -1) {
    return { totalChapters: 0, chaptersPerDay: 0, totalDays: 0, endDate: startDate, error: "Book not found" };
  }
  if (endIdx < startIdx) {
    return { totalChapters: 0, chaptersPerDay: 0, totalDays: 0, endDate: startDate, error: "End book must come after start book" };
  }

  let totalChapters = 0;
  for (let i = startIdx; i <= endIdx; i++) {
    totalChapters += BIBLE_BOOKS[i].chapters;
  }

  const chaptersPerDay = minutesPerDay; // 1 chapter ≈ 1 min
  const totalDays = Math.ceil(totalChapters / chaptersPerDay);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDays);

  return { totalChapters, chaptersPerDay, totalDays, endDate };
}

// ─── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  PREDEFINED_PLANS,
  getGlobalChapterIndex,
  getBookAndChapter,
  chaptersRemaining,
  getPlanById,
  getPlanBySlug,
  generateSchedule,
  calculateRange,
};
