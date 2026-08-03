// Shareable verse links: /v/<book>-<chapter>[-<verse>[-<endVerse>]]
// e.g. /v/john-3-16, /v/1-corinthians-13-4-7, /v/psalms-23 (whole chapter)
// Works server-side (used by the /v route + its OG image) and client-side (share buttons).

import { BIBLE_BOOKS } from "./bible-data";

export const SITE_URL = "https://biblehabit.co";

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

// slug parts → canonical book name. Includes common aliases ("psalm" → Psalms).
const BOOK_SLUGS: { parts: string[]; name: string; chapters: number }[] = [
  ...BIBLE_BOOKS.map((b) => ({ parts: slugify(b.name).split("-"), name: b.name, chapters: b.chapters })),
  { parts: ["psalm"], name: "Psalms", chapters: 150 },
  { parts: ["song", "of", "songs"], name: "Song of Solomon", chapters: 8 },
].sort((a, b) => b.parts.length - a.parts.length); // longest match first

export interface ParsedVerseSlug {
  book: string;
  chapter: number;
  verse?: number;
  verseEnd?: number;
  /** Human reference, e.g. "John 3:16–18" */
  reference: string;
  /** bible-api.com reference, e.g. "John 3:16-18" */
  apiRef: string;
}

export function parseVerseSlug(slug: string): ParsedVerseSlug | null {
  const parts = decodeURIComponent(slug).toLowerCase().split("-").filter(Boolean);
  if (parts.length < 2) return null;

  for (const cand of BOOK_SLUGS) {
    const n = cand.parts.length;
    if (parts.length < n + 1 || parts.length > n + 3) continue;
    if (!cand.parts.every((p, i) => parts[i] === p)) continue;

    const nums = parts.slice(n).map(Number);
    if (nums.some((x) => !Number.isInteger(x) || x < 1)) continue;

    const [chapter, verse, verseEnd] = nums;
    if (chapter > cand.chapters) return null;
    if (verseEnd !== undefined && verse !== undefined && verseEnd <= verse) return null;

    const refTail =
      verse === undefined ? "" : `:${verse}${verseEnd !== undefined ? `–${verseEnd}` : ""}`;
    const apiTail =
      verse === undefined ? "" : `:${verse}${verseEnd !== undefined ? `-${verseEnd}` : ""}`;

    // Traditional style: a single psalm is "Psalm 23", not "Psalms 23"
    const displayName = cand.name === "Psalms" ? "Psalm" : cand.name;

    return {
      book: cand.name,
      chapter,
      verse,
      verseEnd,
      reference: `${displayName} ${chapter}${refTail}`,
      apiRef: `${cand.name} ${chapter}${apiTail}`,
    };
  }
  return null;
}

export function verseShareUrl(book: string, chapter: number, verse?: number, verseEnd?: number): string {
  let slug = `${slugify(book)}-${chapter}`;
  if (verse) {
    slug += `-${verse}`;
    if (verseEnd && verseEnd > verse) slug += `-${verseEnd}`;
  }
  return `${SITE_URL}/v/${slug}`;
}

/** "John 3:16", "Psalm 23:1", "Romans 8:38–39" → share URL (falls back to the homepage). */
export function referenceToShareUrl(reference: string): string {
  const m = reference.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[–—-]\s*(\d+))?)?$/);
  if (!m) return SITE_URL;
  const url = verseShareUrl(m[1], Number(m[2]), m[3] ? Number(m[3]) : undefined, m[4] ? Number(m[4]) : undefined);
  // Only link if the slug round-trips to a real book/chapter.
  const slug = url.slice(`${SITE_URL}/v/`.length);
  return parseVerseSlug(slug) ? url : SITE_URL;
}
