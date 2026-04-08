// XP / Level system for BibleHabit (Duolingo-style gamification)
// Stored in localStorage, no server sync needed

const XP_KEY = "biblehabit_xp";
export const XP_PER_CHAPTER = 10;
export const XP_PER_SUBPLAN_CHAPTER = 5;

const LEVELS = [
  { title: "Seeker",   emoji: "🌱", min: 0 },
  { title: "Student",  emoji: "📖", min: 100 },
  { title: "Disciple", emoji: "✝️", min: 300 },
  { title: "Scholar",  emoji: "📜", min: 700 },
  { title: "Elder",    emoji: "🕊️", min: 1500 },
  { title: "Prophet",  emoji: "⭐", min: 3000 },
];

export function getXP(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(XP_KEY) ?? "0", 10);
}

export function addXP(amount: number): number {
  const current = getXP();
  const next = current + amount;
  if (typeof window !== "undefined") localStorage.setItem(XP_KEY, String(next));
  return next;
}

export interface LevelInfo {
  level: number;       // 1-based
  title: string;
  emoji: string;
  currentXP: number;
  levelXP: number;    // XP at start of this level
  nextXP: number;     // XP at start of next level (or levelXP + 1000 if max)
  progressPct: number; // 0-100 within current level
  isMax: boolean;
}

export function getLevelInfo(xp: number): LevelInfo {
  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) { idx = i; break; }
  }
  const isMax = idx === LEVELS.length - 1;
  const levelXP = LEVELS[idx].min;
  const nextXP = isMax ? levelXP + 1000 : LEVELS[idx + 1].min;
  const progressPct = Math.min(100, Math.round(((xp - levelXP) / (nextXP - levelXP)) * 100));
  return {
    level: idx + 1,
    title: LEVELS[idx].title,
    emoji: LEVELS[idx].emoji,
    currentXP: xp,
    levelXP,
    nextXP,
    progressPct,
    isMax,
  };
}

export function getUserLevel(): LevelInfo {
  return getLevelInfo(getXP());
}
