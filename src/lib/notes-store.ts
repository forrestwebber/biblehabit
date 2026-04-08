// Chapter notes — stored in localStorage, keyed by book+chapter
export interface ChapterNote {
  book: string
  chapter: number
  text: string
  savedAt: string
}

const KEY = "bh-chapter-notes"

function load(): Record<string, ChapterNote> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, ChapterNote>
  } catch {
    return {}
  }
}

function noteKey(book: string, chapter: number) {
  return `${book}:${chapter}`
}

export function getNote(book: string, chapter: number): ChapterNote | null {
  return load()[noteKey(book, chapter)] ?? null
}

export function saveNote(book: string, chapter: number, text: string): void {
  const notes = load()
  if (text.trim()) {
    notes[noteKey(book, chapter)] = { book, chapter, text: text.trim(), savedAt: new Date().toISOString() }
  } else {
    delete notes[noteKey(book, chapter)]
  }
  localStorage.setItem(KEY, JSON.stringify(notes))
}

export function getAllNotes(): ChapterNote[] {
  return Object.values(load()).sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}
