import { describe, it, expect } from "vitest";
import {
  BIBLE_INDEX,
  TOTAL_CHAPTERS,
  positionToChapterIndex,
  chapterIndexToPosition,
  computePace,
  projectFinishDate,
  requiredDailyLoad,
  reflowPlan,
  suggestGoals,
  evaluatePaceStatus,
} from "./pacing";

describe("BIBLE_INDEX", () => {
  it("sums to exactly 1,189 chapters across all 66 books", () => {
    expect(BIBLE_INDEX.length).toBe(66);
    expect(TOTAL_CHAPTERS).toBe(1189);
  });
});

describe("positionToChapterIndex", () => {
  it("resolves Jeremiah 22 to the correct global chapter index", () => {
    // OT books before Jeremiah: Genesis..Isaiah
    const before = [
      50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150,
      31, 12, 8, 66,
    ].reduce((a, b) => a + b, 0); // Genesis..Isaiah
    expect(before).toBe(745);
    expect(positionToChapterIndex("Jeremiah", 22)).toBe(745 + 22); // 767
  });

  it("round-trips through chapterIndexToPosition", () => {
    const idx = positionToChapterIndex("Jeremiah", 22);
    expect(chapterIndexToPosition(idx)).toEqual({ book: "Jeremiah", chapter: 22 });
  });

  it("resolves Genesis 1 to global index 1 and Revelation 22 to 1189", () => {
    expect(positionToChapterIndex("Genesis", 1)).toBe(1);
    expect(positionToChapterIndex("Revelation", 22)).toBe(1189);
  });

  it("throws on an invalid chapter number", () => {
    expect(() => positionToChapterIndex("Jude", 2)).toThrow();
  });
});

describe("projectFinishDate", () => {
  it("projects a 365-day finish at 3.3 chapters/day from chapter 0", () => {
    // 1189 / 3.3 = 360.3 -> ceil 361 days, within the 365-day framing
    const start = new Date("2026-01-01T00:00:00Z");
    const finish = projectFinishDate(0, 3.3, start);
    const daysNeeded = Math.ceil(1189 / 3.3);
    expect(daysNeeded).toBeLessThanOrEqual(365);
    const expected = new Date(start);
    expected.setDate(expected.getDate() + daysNeeded);
    expect(finish.toDateString()).toBe(expected.toDateString());
  });

  it("requiredDailyLoad for a fresh reader targeting 365 days is ~3.26 chapters/day", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const target = new Date("2027-01-01T00:00:00Z");
    const load = requiredDailyLoad(0, target, start);
    expect(load).toBeGreaterThan(3.2);
    expect(load).toBeLessThan(3.35);
  });
});

describe("computePace", () => {
  it("returns a gentle default with insufficient history", () => {
    expect(computePace([]).chaptersPerDay).toBe(1);
    expect(computePace([{ date: "2026-01-01", chapterIndex: 5 }]).chaptersPerDay).toBe(1);
  });

  it("computes chapters/day from two history points", () => {
    const pace = computePace([
      { date: "2026-01-01", chapterIndex: 0 },
      { date: "2026-01-11", chapterIndex: 33 },
    ]);
    expect(pace.chaptersPerDay).toBeCloseTo(3.3, 1);
    expect(pace.daysObserved).toBe(10);
  });
});

describe("reflowPlan — shame-free after a missed-days gap", () => {
  it("produces a sane, encouraging new pace after a 7-day gap with no guilt language", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const target = new Date("2027-01-01T00:00:00Z");
    // Reader is behind: only 20 chapters in, 30 days after start with a 7-day gap baked in
    const fromDate = new Date("2026-01-31T00:00:00Z");
    const result = reflowPlan(20, target, fromDate);

    expect(result.newChaptersPerDay).toBeGreaterThan(0);
    expect(Number.isFinite(result.newChaptersPerDay)).toBe(true);
    expect(result.newFinishDate.getTime()).toBeGreaterThan(fromDate.getTime());

    const shameWords = ["fail", "behind schedule", "missed", "broke", "lazy", "should have", "guilt", "sorry"];
    const lowerMsg = result.message.toLowerCase();
    for (const word of shameWords) {
      expect(lowerMsg).not.toContain(word);
    }
  });

  it("evaluatePaceStatus never emits shame language when behind", () => {
    const planStart = new Date("2026-01-01T00:00:00Z");
    const today = new Date("2026-01-15T00:00:00Z"); // 14 days elapsed
    // Expected ~14 chapters at 1/day, reader only at chapter 5 -> behind
    const status = evaluatePaceStatus(5, 0, planStart, 1, today);
    expect(status.label).toBe("behind");
    const shameWords = ["fail", "lazy", "should have", "guilt", "bad", "sorry"];
    const lowerMsg = status.message.toLowerCase();
    for (const word of shameWords) {
      expect(lowerMsg).not.toContain(word);
    }
  });
});

describe("suggestGoals", () => {
  it("returns exactly 3 suggestions: own-pace destination, year plan, and habit bundle", () => {
    const suggestions = suggestGoals(767, 3.3, new Date("2026-07-19T00:00:00Z"));
    expect(suggestions.length).toBe(3);
    expect(suggestions[0].id).toBe("finish-by-date");
    expect(suggestions[0].type).toBe("destination");
    expect(suggestions[1].id).toBe("year-plan");
    expect(suggestions[1].type).toBe("destination");
    expect(suggestions[2].id).toBe("habit-bundle");
    expect(suggestions[2].type).toBe("habit");
    expect(suggestions[2].dailyComponents?.length).toBe(3);
  });
});
