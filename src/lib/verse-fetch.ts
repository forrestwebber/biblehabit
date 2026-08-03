// Server-side KJV verse fetch for the /v share routes (page + OG image).
import type { ParsedVerseSlug } from "./verse-link";

export interface VerseData {
  verses: { verse: number; text: string }[];
}

export async function fetchVerseText(parsed: ParsedVerseSlug): Promise<VerseData | null> {
  try {
    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(parsed.apiRef)}?translation=kjv`,
      { next: { revalidate: 86400 } } // verse text is immutable — cache a day
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.verses) || data.verses.length === 0) return null;
    return {
      verses: data.verses.map((v: { verse: number; text: string }) => ({
        verse: v.verse,
        text: String(v.text).replace(/\s+/g, " ").trim(),
      })),
    };
  } catch {
    return null;
  }
}
