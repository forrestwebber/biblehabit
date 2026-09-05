import { describe, it, expect } from "vitest";
import { calculateRange, BIBLE_BOOKS, TOTAL_CHAPTERS } from "../bible-data";
import { chaptersForMinutes } from "../reading-time";

describe("calculateRange — reading plan calculator", () => {
  const fixedDate = new Date(2026, 3, 1); // April 1, 2026

  // Regression: the legacy 1 chapter ≈ 1 minute bug gave a brand-new user a
  // 30-chapter first day ("Genesis 1–30, about 100 minutes"). 30 min/day must
  // map to ~11 real chapters, never 30.
  it("30 min/day is ~11 chapters, NOT 30 (minutes-as-chapters bug)", () => {
    const result = calculateRange("Genesis", "Revelation", 30, fixedDate);
    expect(result.chaptersPerDay).not.toBe(30);
    expect(result.chaptersPerDay).toBe(chaptersForMinutes(30));
    expect(result.chaptersPerDay).toBeGreaterThanOrEqual(9);
    expect(result.chaptersPerDay).toBeLessThanOrEqual(12);
  });

  it("Genesis→Revelation at 30 min/day covers 1189 chapters at a real pace", () => {
    const cpd = chaptersForMinutes(30);
    const result = calculateRange("Genesis", "Revelation", 30, fixedDate);
    expect(result.error).toBeUndefined();
    expect(result.totalChapters).toBe(1189);
    expect(result.totalDays).toBe(Math.ceil(1189 / cpd));
    const expectedEnd = new Date(2026, 3, 1);
    expectedEnd.setDate(expectedEnd.getDate() + result.totalDays);
    expect(result.endDate.getTime()).toBe(expectedEnd.getTime());
  });

  it("pace options map to sane chapters/day (15→~5, 30→~11, 60→~22)", () => {
    expect(chaptersForMinutes(15)).toBe(5);
    expect(chaptersForMinutes(30)).toBe(11);
    expect(chaptersForMinutes(60)).toBe(22);
    expect(chaptersForMinutes(1)).toBe(1); // never zero
  });

  it("Psalms→Psalms = 150 chapters", () => {
    const result = calculateRange("Psalms", "Psalms", 30, fixedDate);
    expect(result.error).toBeUndefined();
    expect(result.totalChapters).toBe(150);
    expect(result.totalDays).toBe(Math.ceil(150 / chaptersForMinutes(30)));
  });

  it("Matthew→Revelation = 260 chapters", () => {
    const result = calculateRange("Matthew", "Revelation", 30, fixedDate);
    expect(result.error).toBeUndefined();
    expect(result.totalChapters).toBe(260);
    expect(result.totalDays).toBe(Math.ceil(260 / chaptersForMinutes(30)));
  });

  it("shows error when end book is before start book", () => {
    const result = calculateRange("Matthew", "Genesis", 30, fixedDate);
    expect(result.error).toBe("End book must come after start book");
    expect(result.totalChapters).toBe(0);
  });

  it("Obadiah→Obadiah = 1 chapter", () => {
    const result = calculateRange("Obadiah", "Obadiah", 30, fixedDate);
    expect(result.error).toBeUndefined();
    expect(result.totalChapters).toBe(1);
    expect(result.totalDays).toBe(1);
  });

  it("TOTAL_CHAPTERS equals 1189", () => {
    expect(TOTAL_CHAPTERS).toBe(1189);
  });

  it("BIBLE_BOOKS has 66 entries", () => {
    expect(BIBLE_BOOKS.length).toBe(66);
  });
});
