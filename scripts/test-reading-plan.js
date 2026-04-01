/**
 * test-reading-plan.js — Validates BibleHabit reading plan logic
 *
 * Run from /platforms/biblehabit dir:
 *   node scripts/test-reading-plan.js
 *
 * Tests:
 *  1. 1-Year Whole Bible plan  (365 days, starts Genesis)
 *  2. 90-Day New Testament plan (90 days, starts Matthew)
 *  3. Custom plan              (user-defined: Psalms 1 → end, 2 ch/day)
 */

const path = require("path");

// Load reading-plan.js from src folder (relative to this script's location)
const {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  PREDEFINED_PLANS,
  getGlobalChapterIndex,
  getBookAndChapter,
  chaptersRemaining,
  getPlanBySlug,
  generateSchedule,
  calculateRange,
} = require(path.join(__dirname, "../src/reading-plan.js"));

// ─── Test Harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = "") {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`📖  ${title}`);
  console.log("─".repeat(60));
}

// ─── Foundation Checks ────────────────────────────────────────────────────────

section("Foundation: Bible Data Integrity");

assert(BIBLE_BOOKS.length === 66, "66 books in BIBLE_BOOKS");
assert(TOTAL_CHAPTERS === 1189, `Total chapters = 1189 (got ${TOTAL_CHAPTERS})`);
assert(
  BIBLE_BOOKS.filter((b) => b.testament === "OT").length === 39,
  "39 Old Testament books"
);
assert(
  BIBLE_BOOKS.filter((b) => b.testament === "NT").length === 27,
  "27 New Testament books"
);

// NT chapter count: Matthew–Revelation = 260 chapters
const ntChapters = BIBLE_BOOKS.filter((b) => b.testament === "NT").reduce(
  (sum, b) => sum + b.chapters,
  0
);
assert(ntChapters === 260, `NT chapters = 260 (got ${ntChapters})`);

// OT chapter count = 929
const otChapters = BIBLE_BOOKS.filter((b) => b.testament === "OT").reduce(
  (sum, b) => sum + b.chapters,
  0
);
assert(otChapters === 929, `OT chapters = 929 (got ${otChapters})`);

// getGlobalChapterIndex: Genesis 1 → 0, Matthew 1 → 929
const genesisIdx = getGlobalChapterIndex("Genesis", 1);
assert(genesisIdx === 0, `Genesis 1 → global index 0 (got ${genesisIdx})`);

const matthewIdx = getGlobalChapterIndex("Matthew", 1);
assert(matthewIdx === 929, `Matthew 1 → global index 929 (got ${matthewIdx})`);

const revIdx = getGlobalChapterIndex("Revelation", 22);
assert(revIdx === 1188, `Revelation 22 → global index 1188 (got ${revIdx})`);

// getBookAndChapter round-trip
const roundTrip = getBookAndChapter(929);
assert(
  roundTrip.book === "Matthew" && roundTrip.chapter === 1,
  `Global 929 → Matthew 1 (got ${roundTrip.book} ${roundTrip.chapter})`
);

// chaptersRemaining from Genesis 1 = 1189
const remaining = chaptersRemaining("Genesis", 1);
assert(remaining === 1189, `chaptersRemaining(Genesis, 1) = 1189 (got ${remaining})`);

// ─── TEST 1: 1-Year Whole Bible Plan ─────────────────────────────────────────

section("Test 1: 1-Year Whole Bible Plan");

const yearPlan = getPlanBySlug("whole-bible-1-year");
assert(yearPlan !== undefined, "Plan 'whole-bible-1-year' exists in PREDEFINED_PLANS");
assert(yearPlan.durationDays === 365, `Duration = 365 days (got ${yearPlan.durationDays})`);
assert(yearPlan.startBook === "Genesis", `Starts at Genesis (got ${yearPlan.startBook})`);
assert(yearPlan.startChapter === 1, `Starts at chapter 1 (got ${yearPlan.startChapter})`);

const fixedStart = new Date(2026, 0, 1); // Jan 1 2026 in local time (avoids UTC offset issues)
const yearSchedule = generateSchedule(yearPlan, fixedStart);

assert(yearSchedule.length === 365, `Schedule has 365 days (got ${yearSchedule.length})`);

// First day must include Genesis 1
const day1 = yearSchedule[0];
assert(day1.date === "2026-01-01", `Day 1 date = 2026-01-01 (got ${day1.date})`);
assert(
  day1.chapters[0] === "Genesis 1",
  `Day 1 first chapter = "Genesis 1" (got "${day1.chapters[0]}")`
);
assert(day1.chapters.length >= 3, `Day 1 has ≥3 chapters (got ${day1.chapters.length})`);

// Last day must end at Revelation
const lastDay = yearSchedule[yearSchedule.length - 1];
const lastChapter = lastDay.chapters[lastDay.chapters.length - 1];
assert(
  lastChapter === "Revelation 22",
  `Last chapter of plan = "Revelation 22" (got "${lastChapter}")`
);

// Total chapters covered = 1189
const yearTotalChapters = yearSchedule.reduce((sum, d) => sum + d.chapters.length, 0);
assert(
  yearTotalChapters === 1189,
  `1-year plan covers all 1189 chapters (got ${yearTotalChapters})`
);

// Sample check: day 2 starts after day 1 ends
const day2 = yearSchedule[1];
assert(
  day2.date === "2026-01-02",
  `Day 2 date = 2026-01-02 (got ${day2.date})`
);

// Summary format check
assert(
  typeof day1.summary === "string" && day1.summary.includes("Genesis"),
  `Day 1 summary is a string containing "Genesis" (got "${day1.summary}")`
);

console.log(
  `  📋 Day 1 reading: ${day1.summary} (${day1.chapters.length} chapters)`
);
console.log(
  `  📋 Last day reading: ${lastDay.summary} (${lastDay.chapters.length} chapters)`
);

// ─── TEST 2: 90-Day New Testament Plan ────────────────────────────────────────

section("Test 2: 90-Day New Testament Plan");

const ntPlan = getPlanBySlug("new-testament-90-days");
assert(ntPlan !== undefined, "Plan 'new-testament-90-days' exists");
assert(ntPlan.durationDays === 90, `Duration = 90 days (got ${ntPlan.durationDays})`);
assert(ntPlan.startBook === "Matthew", `Starts at Matthew (got ${ntPlan.startBook})`);

const ntSchedule = generateSchedule(ntPlan, fixedStart);

assert(ntSchedule.length === 90, `NT schedule has 90 days (got ${ntSchedule.length})`);

// Day 1 must start at Matthew 1
const ntDay1 = ntSchedule[0];
assert(
  ntDay1.chapters[0] === "Matthew 1",
  `NT Day 1 first chapter = "Matthew 1" (got "${ntDay1.chapters[0]}")`
);

// Last day must end at Revelation 22
const ntLastDay = ntSchedule[ntSchedule.length - 1];
const ntLastChapter = ntLastDay.chapters[ntLastDay.chapters.length - 1];
assert(
  ntLastChapter === "Revelation 22",
  `NT last chapter = "Revelation 22" (got "${ntLastChapter}")`
);

// Total chapters = 260 (NT only)
const ntTotal = ntSchedule.reduce((sum, d) => sum + d.chapters.length, 0);
assert(ntTotal === 260, `NT plan covers 260 chapters (got ${ntTotal})`);

// No OT books in the NT plan
const hasOT = ntSchedule.some((day) =>
  day.chapters.some((ch) =>
    BIBLE_BOOKS.filter((b) => b.testament === "OT").some((b) => ch.startsWith(b.name))
  )
);
assert(!hasOT, "NT plan contains no Old Testament chapters");

console.log(
  `  📋 NT Day 1: ${ntDay1.summary} (${ntDay1.chapters.length} chapters)`
);
console.log(
  `  📋 NT Day 90: ${ntLastDay.summary} (${ntLastDay.chapters.length} chapters)`
);

// ─── TEST 3: Custom Plan ───────────────────────────────────────────────────────

section("Test 3: Custom Plan (Psalms 1 → Proverbs 31, 2 ch/day)");

// Custom plan: read Psalms + Proverbs (181 chapters) at 2 chapters/day = 91 days
const customPlan = {
  slug: "custom-psalms-proverbs",
  title: "Custom: Psalms + Proverbs",
  startBook: "Psalms",
  startChapter: 1,
  endBook: "Proverbs",
  chaptersPerDay: 2,
  durationDays: 91, // 181 chapters / 2 = 90.5 → 91 days
  category: "custom",
};

const customSchedule = generateSchedule(customPlan, fixedStart);

// 181 chapters at 2/day = 91 days (first day gets extra due to odd total)
assert(
  customSchedule.length === 91,
  `Custom plan has 91 days (got ${customSchedule.length})`
);

// Day 1 starts at Psalms 1
const cDay1 = customSchedule[0];
assert(
  cDay1.chapters[0] === "Psalms 1",
  `Custom Day 1 starts at "Psalms 1" (got "${cDay1.chapters[0]}")`
);

// Last chapter = Proverbs 31
const cLastDay = customSchedule[customSchedule.length - 1];
const cLastChapter = cLastDay.chapters[cLastDay.chapters.length - 1];
assert(
  cLastChapter === "Proverbs 31",
  `Custom last chapter = "Proverbs 31" (got "${cLastChapter}")`
);

// Total chapters = 181
const customTotal = customSchedule.reduce((sum, d) => sum + d.chapters.length, 0);
assert(customTotal === 181, `Custom plan covers 181 chapters (got ${customTotal})`);

// Verify each day has 2 chapters (except possible last day)
const daysWith2 = customSchedule.filter((d) => d.chapters.length === 2).length;
const daysWith1 = customSchedule.filter((d) => d.chapters.length === 1).length;
assert(
  daysWith2 + daysWith1 === 91,
  `All days have 1 or 2 chapters (${daysWith2} with 2, ${daysWith1} with 1)`
);

console.log(
  `  📋 Custom Day 1: ${cDay1.summary} (${cDay1.chapters.length} chapters)`
);
console.log(
  `  📋 Custom last day: ${cLastDay.summary} (${cLastDay.chapters.length} chapters)`
);

// ─── Bonus: calculateRange utility ───────────────────────────────────────────

section("Bonus: calculateRange() Utility");

const genToRevRange = calculateRange("Genesis", "Revelation", 30, fixedStart);
assert(genToRevRange.totalChapters === 1189, `Genesis→Revelation = 1189 chapters`);
assert(genToRevRange.totalDays === 40, `1189 chapters / 30/day = 40 days (got ${genToRevRange.totalDays})`);
assert(!genToRevRange.error, "No error for valid range");

const invalidRange = calculateRange("Matthew", "Genesis", 30, fixedStart);
assert(
  invalidRange.error === "End book must come after start book",
  "Invalid range returns error message"
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(60)}`);
const total = passed + failed;
if (failed === 0) {
  console.log(`✅ ALL ${total} TESTS PASSED`);
} else {
  console.log(`❌ ${failed} of ${total} TESTS FAILED`);
  process.exit(1);
}
console.log("═".repeat(60));
console.log("\nReading plan logic validated. UI layer can now be built.");
