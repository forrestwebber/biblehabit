// Verse highlights / saved moments from Bible reading
// Stored in localStorage with Supabase sync planned for future

const HIGHLIGHTS_KEY = "biblehabit_highlights";

export interface Highlight {
  id: string;
  book: string;
  chapter: number;
  verses: number[];      // verse numbers in the selection
  text: string;          // full text of selected verse(s)
  note?: string;         // optional personal note
  savedAt: string;       // ISO date
}

export function getHighlights(): Highlight[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveHighlight(h: Omit<Highlight, "id" | "savedAt">): Highlight {
  const full: Highlight = {
    ...h,
    id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    savedAt: new Date().toISOString(),
  };
  const existing = getHighlights();
  existing.unshift(full); // newest first
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(existing));
  return full;
}

export function removeHighlight(id: string): void {
  const filtered = getHighlights().filter((h) => h.id !== id);
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(filtered));
}

export function getTotalHighlights(): number {
  return getHighlights().length;
}
