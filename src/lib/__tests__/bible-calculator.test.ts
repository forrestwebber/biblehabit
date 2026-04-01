import { describe, it, expect } from "vitest";
import { calculateRange, BIBLE_BOOKS, TOTAL_CHAPTERS } from "../bible-data";

describe("calculateRange — reading plan calculator", () => {
  const fixedDate = new Date(2026, 3, 1); // April 1, 2026

  // Test 1: Genesis→Revelation, 30 min/day → 1189 chapters, ~40 days
  it("Genesis→Revelation at 30 min/day = 1189 chapters, 40 days", () => {
    const result = calculateRange("Genesis", "Revelation", 30, fixedDate);
    expect(result.error).toBeUndefined();
    expect(result.totalChapters).toBe(1189);
    expect(result.chaptersPerDay).toBe(30);
    expect(result.totalDays).toBe(Math.ceil(1189 / 30)); // 40
    // End date = April 1 + 40 days = May 11
    const expectedEnd = new Date(2026, 3, 1);
    expectedEnd.setDate(expectedEnd.getDate() + 40);
    expect(result.endDate.getTime()).toBe(expectedEnd.getTime());
  });

  // Test 2: Psalms only → 150 chapters, 5 days at 30min
  it("Psalms→Psalms at 30 min/day = 150 chapters, 5 days", () => {
    const result = calculateRange("Psalms", "Psalms", 30, fixedDate);
    expect(result.error).toBeUndefined();
    expect(result.totalChapters).toBe(150);
    expect(result.totalDays).toBe(5);
  });

  // Test 3: Matthew→Revelation → 260 chapters
  it("Matthew→Revelation = 260 chapters", () => {
    const result = calculateRange("Matthew", "Revelation", 30, fixedDate);
    expect(result.error).toBeUndefined();
    expect(result.totalChapters).toBe(260);
    expect(result.totalDays).toBe(Math.ceil(260 / 30)); // 9
  });

  // Test 4: Invalid range (end book BEFORE start) → error
  it("shows error when end book is before start book", () => {
    const result = calculateRange("Matthew", "Genesis", 30, fixedDate);
    expect(result.error).toBe("End book must come after start book");
    expect(result.totalChapters).toBe(0);
  });

  // Test 5: Single book (Obadiah) → 1 chapter
  it("Obadiah→Obadiah = 1 chapter", () => {
    const result = calculateRange("Obadiah", "Obadiah", 30, fixedDate);
    expect(result.error).toBeUndefined();
    expect(result.totalChapters).toBe(1);
    expect(result.totalDays).toBe(1);
  });

  // Bonus: verify total Bible chapters constant
  it("TOTAL_CHAPTERS equals 1189", () => {
    expect(TOTAL_CHAPTERS).toBe(1189);
  });

  // Bonus: 66 books in the Bible
  it("BIBLE_BOOKS has 66 entries", () => {
    expect(BIBLE_BOOKS.length).toBe(66);
  });
});
