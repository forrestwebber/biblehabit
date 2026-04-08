// Complete Bible data: 66 books with chapter counts (KJV)
export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'OT' | 'NT';
  abbreviation: string;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: "Genesis", chapters: 50, testament: "OT", abbreviation: "Gen" },
  { name: "Exodus", chapters: 40, testament: "OT", abbreviation: "Exo" },
  { name: "Leviticus", chapters: 27, testament: "OT", abbreviation: "Lev" },
  { name: "Numbers", chapters: 36, testament: "OT", abbreviation: "Num" },
  { name: "Deuteronomy", chapters: 34, testament: "OT", abbreviation: "Deu" },
  { name: "Joshua", chapters: 24, testament: "OT", abbreviation: "Jos" },
  { name: "Judges", chapters: 21, testament: "OT", abbreviation: "Jdg" },
  { name: "Ruth", chapters: 4, testament: "OT", abbreviation: "Rth" },
  { name: "1 Samuel", chapters: 31, testament: "OT", abbreviation: "1Sa" },
  { name: "2 Samuel", chapters: 24, testament: "OT", abbreviation: "2Sa" },
  { name: "1 Kings", chapters: 22, testament: "OT", abbreviation: "1Ki" },
  { name: "2 Kings", chapters: 25, testament: "OT", abbreviation: "2Ki" },
  { name: "1 Chronicles", chapters: 29, testament: "OT", abbreviation: "1Ch" },
  { name: "2 Chronicles", chapters: 36, testament: "OT", abbreviation: "2Ch" },
  { name: "Ezra", chapters: 10, testament: "OT", abbreviation: "Ezr" },
  { name: "Nehemiah", chapters: 13, testament: "OT", abbreviation: "Neh" },
  { name: "Esther", chapters: 10, testament: "OT", abbreviation: "Est" },
  { name: "Job", chapters: 42, testament: "OT", abbreviation: "Job" },
  { name: "Psalms", chapters: 150, testament: "OT", abbreviation: "Psa" },
  { name: "Proverbs", chapters: 31, testament: "OT", abbreviation: "Pro" },
  { name: "Ecclesiastes", chapters: 12, testament: "OT", abbreviation: "Ecc" },
  { name: "Song of Solomon", chapters: 8, testament: "OT", abbreviation: "Son" },
  { name: "Isaiah", chapters: 66, testament: "OT", abbreviation: "Isa" },
  { name: "Jeremiah", chapters: 52, testament: "OT", abbreviation: "Jer" },
  { name: "Lamentations", chapters: 5, testament: "OT", abbreviation: "Lam" },
  { name: "Ezekiel", chapters: 48, testament: "OT", abbreviation: "Eze" },
  { name: "Daniel", chapters: 12, testament: "OT", abbreviation: "Dan" },
  { name: "Hosea", chapters: 14, testament: "OT", abbreviation: "Hos" },
  { name: "Joel", chapters: 3, testament: "OT", abbreviation: "Joe" },
  { name: "Amos", chapters: 9, testament: "OT", abbreviation: "Amo" },
  { name: "Obadiah", chapters: 1, testament: "OT", abbreviation: "Oba" },
  { name: "Jonah", chapters: 4, testament: "OT", abbreviation: "Jon" },
  { name: "Micah", chapters: 7, testament: "OT", abbreviation: "Mic" },
  { name: "Nahum", chapters: 3, testament: "OT", abbreviation: "Nah" },
  { name: "Habakkuk", chapters: 3, testament: "OT", abbreviation: "Hab" },
  { name: "Zephaniah", chapters: 3, testament: "OT", abbreviation: "Zep" },
  { name: "Haggai", chapters: 2, testament: "OT", abbreviation: "Hag" },
  { name: "Zechariah", chapters: 14, testament: "OT", abbreviation: "Zec" },
  { name: "Malachi", chapters: 4, testament: "OT", abbreviation: "Mal" },
  // New Testament
  { name: "Matthew", chapters: 28, testament: "NT", abbreviation: "Mat" },
  { name: "Mark", chapters: 16, testament: "NT", abbreviation: "Mar" },
  { name: "Luke", chapters: 24, testament: "NT", abbreviation: "Luk" },
  { name: "John", chapters: 21, testament: "NT", abbreviation: "Jhn" },
  { name: "Acts", chapters: 28, testament: "NT", abbreviation: "Act" },
  { name: "Romans", chapters: 16, testament: "NT", abbreviation: "Rom" },
  { name: "1 Corinthians", chapters: 16, testament: "NT", abbreviation: "1Co" },
  { name: "2 Corinthians", chapters: 13, testament: "NT", abbreviation: "2Co" },
  { name: "Galatians", chapters: 6, testament: "NT", abbreviation: "Gal" },
  { name: "Ephesians", chapters: 6, testament: "NT", abbreviation: "Eph" },
  { name: "Philippians", chapters: 4, testament: "NT", abbreviation: "Php" },
  { name: "Colossians", chapters: 4, testament: "NT", abbreviation: "Col" },
  { name: "1 Thessalonians", chapters: 5, testament: "NT", abbreviation: "1Th" },
  { name: "2 Thessalonians", chapters: 3, testament: "NT", abbreviation: "2Th" },
  { name: "1 Timothy", chapters: 6, testament: "NT", abbreviation: "1Ti" },
  { name: "2 Timothy", chapters: 4, testament: "NT", abbreviation: "2Ti" },
  { name: "Titus", chapters: 3, testament: "NT", abbreviation: "Tit" },
  { name: "Philemon", chapters: 1, testament: "NT", abbreviation: "Phm" },
  { name: "Hebrews", chapters: 13, testament: "NT", abbreviation: "Heb" },
  { name: "James", chapters: 5, testament: "NT", abbreviation: "Jam" },
  { name: "1 Peter", chapters: 5, testament: "NT", abbreviation: "1Pe" },
  { name: "2 Peter", chapters: 3, testament: "NT", abbreviation: "2Pe" },
  { name: "1 John", chapters: 5, testament: "NT", abbreviation: "1Jn" },
  { name: "2 John", chapters: 1, testament: "NT", abbreviation: "2Jn" },
  { name: "3 John", chapters: 1, testament: "NT", abbreviation: "3Jn" },
  { name: "Jude", chapters: 1, testament: "NT", abbreviation: "Jde" },
  { name: "Revelation", chapters: 22, testament: "NT", abbreviation: "Rev" },
];

export const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0); // 1189

// Get the global chapter index for a book+chapter
export function getGlobalChapterIndex(bookName: string, chapter: number): number {
  let index = 0;
  for (const book of BIBLE_BOOKS) {
    if (book.name === bookName) {
      return index + chapter - 1;
    }
    index += book.chapters;
  }
  return 0;
}

// Get book+chapter from a global chapter index
export function getBookAndChapter(globalIndex: number): { book: string; chapter: number } {
  let running = 0;
  for (const book of BIBLE_BOOKS) {
    if (globalIndex < running + book.chapters) {
      return { book: book.name, chapter: globalIndex - running + 1 };
    }
    running += book.chapters;
  }
  return { book: "Revelation", chapter: 22 };
}

// Calculate chapters remaining from a starting point to end of Bible
export function chaptersRemaining(bookName: string, chapter: number): number {
  const startIndex = getGlobalChapterIndex(bookName, chapter);
  return TOTAL_CHAPTERS - startIndex;
}

// Calculate chapters in a plan range (start → end book inclusive)
// If endBook is omitted, counts to end of Bible.
export function getChaptersInPlan(
  startBook: string,
  startChapter: number,
  endBook?: string
): number {
  const startGlobal = getGlobalChapterIndex(startBook, startChapter);
  if (!endBook || endBook === "Revelation") {
    return TOTAL_CHAPTERS - startGlobal;
  }
  const endBookData = BIBLE_BOOKS.find((b) => b.name === endBook);
  if (!endBookData) return TOTAL_CHAPTERS - startGlobal;
  const endGlobal = getGlobalChapterIndex(endBook, endBookData.chapters); // last chapter of endBook
  return Math.max(1, endGlobal - startGlobal + 1);
}

// Global index of the last chapter of a plan (used to cap reading)
export function getPlanEndGlobal(endBook?: string): number {
  if (!endBook || endBook === "Revelation") return TOTAL_CHAPTERS - 1;
  const endBookData = BIBLE_BOOKS.find((b) => b.name === endBook);
  if (!endBookData) return TOTAL_CHAPTERS - 1;
  return getGlobalChapterIndex(endBook, endBookData.chapters);
}

// Calculate reading plan
export interface ReadingPlan {
  startBook: string;
  startChapter: number;
  chaptersPerDay: number;
  totalDays: number;
  totalChapters: number;
  finishDate: Date;
  dailyReadings: { book: string; chapters: string }[];
}

export function calculatePlan(
  startBook: string,
  startChapter: number,
  chaptersPerDay: number,
  startDate: Date = new Date()
): ReadingPlan {
  const total = chaptersRemaining(startBook, startChapter);
  const totalDays = Math.ceil(total / chaptersPerDay);
  const finishDate = new Date(startDate);
  finishDate.setDate(finishDate.getDate() + totalDays);

  // Generate daily readings
  const dailyReadings: { book: string; chapters: string }[] = [];
  let currentGlobal = getGlobalChapterIndex(startBook, startChapter);

  for (let day = 0; day < Math.min(totalDays, 7); day++) {
    const startBC = getBookAndChapter(currentGlobal);
    const endGlobal = Math.min(currentGlobal + chaptersPerDay - 1, TOTAL_CHAPTERS - 1);
    const endBC = getBookAndChapter(endGlobal);

    if (startBC.book === endBC.book) {
      if (startBC.chapter === endBC.chapter) {
        dailyReadings.push({ book: startBC.book, chapters: `${startBC.chapter}` });
      } else {
        dailyReadings.push({ book: startBC.book, chapters: `${startBC.chapter}–${endBC.chapter}` });
      }
    } else {
      dailyReadings.push({
        book: startBC.book,
        chapters: `${startBC.chapter}+ → ${endBC.book} ${endBC.chapter}`,
      });
    }

    currentGlobal = endGlobal + 1;
    if (currentGlobal >= TOTAL_CHAPTERS) break;
  }

  return {
    startBook,
    startChapter,
    chaptersPerDay,
    totalDays,
    totalChapters: total,
    finishDate,
    dailyReadings,
  };
}

// Generate FULL daily readings for the entire plan (for calendar/export)
export interface FullDayReading {
  day: number;
  date: Date;
  dateStr: string; // YYYY-MM-DD
  book: string;
  chapters: string;
  summary: string; // e.g. "Genesis 1–3"
}

export function generateFullPlan(
  startBook: string,
  startChapter: number,
  chaptersPerDay: number,
  startDate: Date = new Date()
): FullDayReading[] {
  const total = chaptersRemaining(startBook, startChapter);
  const totalDays = Math.ceil(total / chaptersPerDay);
  const readings: FullDayReading[] = [];
  let currentGlobal = getGlobalChapterIndex(startBook, startChapter);

  for (let day = 0; day < totalDays; day++) {
    if (currentGlobal >= TOTAL_CHAPTERS) break;

    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;

    const startBC = getBookAndChapter(currentGlobal);
    const endGlobal = Math.min(currentGlobal + chaptersPerDay - 1, TOTAL_CHAPTERS - 1);
    const endBC = getBookAndChapter(endGlobal);

    let chapters: string;
    let summary: string;

    if (startBC.book === endBC.book) {
      if (startBC.chapter === endBC.chapter) {
        chapters = `${startBC.chapter}`;
        summary = `${startBC.book} ${startBC.chapter}`;
      } else {
        chapters = `${startBC.chapter}–${endBC.chapter}`;
        summary = `${startBC.book} ${startBC.chapter}–${endBC.chapter}`;
      }
    } else {
      chapters = `${startBC.chapter}+ → ${endBC.book} ${endBC.chapter}`;
      summary = `${startBC.book} ${startBC.chapter} – ${endBC.book} ${endBC.chapter}`;
    }

    readings.push({
      day: day + 1,
      date: dayDate,
      dateStr,
      book: startBC.book,
      chapters,
      summary,
    });

    currentGlobal = endGlobal + 1;
  }

  return readings;
}

// Get book color for calendar display
const BOOK_COLORS: Record<string, string> = {
  // Pentateuch
  Genesis: "#7c6dff", Exodus: "#7c6dff", Leviticus: "#7c6dff", Numbers: "#7c6dff", Deuteronomy: "#7c6dff",
  // History
  Joshua: "#00b4d8", Judges: "#00b4d8", Ruth: "#00b4d8", "1 Samuel": "#00b4d8", "2 Samuel": "#00b4d8",
  "1 Kings": "#00b4d8", "2 Kings": "#00b4d8", "1 Chronicles": "#00b4d8", "2 Chronicles": "#00b4d8",
  Ezra: "#00b4d8", Nehemiah: "#00b4d8", Esther: "#00b4d8",
  // Poetry
  Job: "#f59e0b", Psalms: "#f59e0b", Proverbs: "#f59e0b", Ecclesiastes: "#f59e0b", "Song of Solomon": "#f59e0b",
  // Major Prophets
  Isaiah: "#ef4444", Jeremiah: "#ef4444", Lamentations: "#ef4444", Ezekiel: "#ef4444", Daniel: "#ef4444",
  // Minor Prophets
  Hosea: "#f97316", Joel: "#f97316", Amos: "#f97316", Obadiah: "#f97316", Jonah: "#f97316",
  Micah: "#f97316", Nahum: "#f97316", Habakkuk: "#f97316", Zephaniah: "#f97316", Haggai: "#f97316",
  Zechariah: "#f97316", Malachi: "#f97316",
  // Gospels
  Matthew: "#10b981", Mark: "#10b981", Luke: "#10b981", John: "#10b981",
  // Acts & Paul
  Acts: "#06b6d4", Romans: "#8b5cf6", "1 Corinthians": "#8b5cf6", "2 Corinthians": "#8b5cf6",
  Galatians: "#8b5cf6", Ephesians: "#8b5cf6", Philippians: "#8b5cf6", Colossians: "#8b5cf6",
  "1 Thessalonians": "#8b5cf6", "2 Thessalonians": "#8b5cf6", "1 Timothy": "#8b5cf6", "2 Timothy": "#8b5cf6",
  Titus: "#8b5cf6", Philemon: "#8b5cf6",
  // General & Revelation
  Hebrews: "#ec4899", James: "#ec4899", "1 Peter": "#ec4899", "2 Peter": "#ec4899",
  "1 John": "#ec4899", "2 John": "#ec4899", "3 John": "#ec4899", Jude: "#ec4899", Revelation: "#ec4899",
};

export function getBookColor(bookName: string): string {
  return BOOK_COLORS[bookName] || "#7c6dff";
}

// ─── Range Calculator (for /plans form) ─────────────────────────
export interface RangeResult {
  totalChapters: number;
  chaptersPerDay: number;
  totalDays: number;
  endDate: Date;
  error?: string;
}

/**
 * Calculate a reading plan between two books (inclusive).
 * chaptersPerMinute = 1 (task spec: 30 min → 30 ch/day).
 */
export function calculateRange(
  startBookName: string,
  endBookName: string,
  minutesPerDay: number,
  startDate: Date = new Date()
): RangeResult {
  const startIdx = BIBLE_BOOKS.findIndex((b) => b.name === startBookName);
  const endIdx = BIBLE_BOOKS.findIndex((b) => b.name === endBookName);

  if (startIdx === -1 || endIdx === -1) {
    return { totalChapters: 0, chaptersPerDay: 0, totalDays: 0, endDate: startDate, error: "Book not found" };
  }

  if (endIdx < startIdx) {
    return { totalChapters: 0, chaptersPerDay: 0, totalDays: 0, endDate: startDate, error: "End book must come after start book" };
  }

  // Total chapters from startBook through endBook (inclusive)
  let totalChapters = 0;
  for (let i = startIdx; i <= endIdx; i++) {
    totalChapters += BIBLE_BOOKS[i].chapters;
  }

  // 1 chapter ≈ 1 minute reading time
  const chaptersPerDay = minutesPerDay;
  const totalDays = Math.ceil(totalChapters / chaptersPerDay);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDays);

  return { totalChapters, chaptersPerDay, totalDays, endDate };
}

// Get today's reading based on a saved plan
export function getTodaysReading(
  startBook: string,
  startChapter: number,
  chaptersPerDay: number,
  planStartDate: Date
): { book: string; startChapter: number; endChapter: number; endBook?: string; dayNumber: number; totalDays: number } {
  const daysSinceStart = Math.floor(
    (new Date().getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dayNumber = daysSinceStart + 1;
  const totalChapters = chaptersRemaining(startBook, startChapter);
  const totalDays = Math.ceil(totalChapters / chaptersPerDay);

  const globalStart = getGlobalChapterIndex(startBook, startChapter) + daysSinceStart * chaptersPerDay;
  const globalEnd = Math.min(globalStart + chaptersPerDay - 1, TOTAL_CHAPTERS - 1);

  const startBC = getBookAndChapter(Math.min(globalStart, TOTAL_CHAPTERS - 1));
  const endBC = getBookAndChapter(globalEnd);

  return {
    book: startBC.book,
    startChapter: startBC.chapter,
    endChapter: endBC.chapter,
    endBook: startBC.book !== endBC.book ? endBC.book : undefined,
    dayNumber: Math.min(dayNumber, totalDays),
    totalDays,
  };
}

// Milestone projections
export function getMilestones(
  startBook: string,
  startChapter: number,
  chaptersPerDay: number,
  startDate: Date = new Date()
): { date: Date; book: string; label: string }[] {
  const milestoneBooks = ["Psalms", "Isaiah", "Matthew", "Acts", "Romans", "Revelation"];
  const milestones: { date: Date; book: string; label: string }[] = [];
  const startGlobal = getGlobalChapterIndex(startBook, startChapter);

  for (const mb of milestoneBooks) {
    const mbIndex = getGlobalChapterIndex(mb, 1);
    if (mbIndex > startGlobal) {
      const daysToReach = Math.ceil((mbIndex - startGlobal) / chaptersPerDay);
      const date = new Date(startDate);
      date.setDate(date.getDate() + daysToReach);
      milestones.push({ date, book: mb, label: `Starting ${mb}` });
    }
  }

  return milestones;
}
