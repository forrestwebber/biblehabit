"use client";

/**
 * "Already reading? Pick up where you are" — the real thing.
 *
 * This replaced two hardcoded mockups on the marketing homepage. They looked
 * functional but every control was decorative: the chapter <select> offered
 * Ch. 1/2/3/5/10/15/20/25 (so "I'm on Genesis 45" was unsayable), the book
 * list ignored what you picked, and "864 chapters to Revelation / ~345 days /
 * February 2027" were literal strings. Forrest found it from inside the iOS
 * app on 2026-08-02.
 *
 * Now: every book, every chapter of that book, and the projection computed
 * from the same reading-time model the app itself uses (~2.8 min per average
 * KJV chapter at 238 wpm). Choosing a pace here writes the real plan, so
 * signing up lands you on the day you said you were on.
 */

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BIBLE_BOOKS, chaptersRemaining, getBookAndChapter, getGlobalChapterIndex, TOTAL_CHAPTERS } from "@/lib/bible-data";
import { chaptersForMinutes, estimateDailyMinutes } from "@/lib/reading-time";
import { savePlan } from "@/lib/reading-store";

const PACE_OPTIONS = [
  { minutes: 5, label: "5 min" },
  { minutes: 15, label: "15 min" },
  { minutes: 25, label: "25 min" },
  { minutes: 40, label: "40 min" },
];

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PickUpCalculator() {
  const [book, setBook] = useState("Genesis");
  const [chapter, setChapter] = useState(1);
  const [minutes, setMinutes] = useState(15);

  const chaptersInBook = useMemo(
    () => BIBLE_BOOKS.find((b) => b.name === book)?.chapters ?? 1,
    [book]
  );

  useEffect(() => {
    setChapter((c) => Math.min(c, chaptersInBook));
  }, [chaptersInBook]);

  const chaptersPerDay = chaptersForMinutes(minutes);
  const realMinutes = estimateDailyMinutes(book, chaptersPerDay);
  const remaining = chaptersRemaining(book, chapter);
  const days = Math.max(1, Math.ceil(remaining / chaptersPerDay));

  const finishDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }, [days]);

  // Where this pace actually puts you by Christmas — real arithmetic, not a
  // hardcoded "You'll be in Acts".
  const christmasSpot = useMemo(() => {
    const now = new Date();
    const xmas = new Date(now.getFullYear(), 11, 25);
    if (xmas < now) xmas.setFullYear(xmas.getFullYear() + 1);
    const daysUntil = Math.max(0, Math.round((xmas.getTime() - now.getTime()) / 86_400_000));
    const idx = Math.min(
      getGlobalChapterIndex(book, chapter) + daysUntil * chaptersPerDay,
      TOTAL_CHAPTERS - 1
    );
    const { book: b, chapter: c } = getBookAndChapter(idx);
    return idx >= TOTAL_CHAPTERS - 1 ? "Finished — the whole Bible" : `${b} ${c}`;
  }, [book, chapter, chaptersPerDay]);

  // Persist the plan the visitor just described, then send them to sign in.
  // getPlan() reads it back after auth, so day one is the day they told us.
  function handleStart() {
    savePlan({
      startBook: book,
      startChapter: chapter,
      chaptersPerDay,
      startDate: todayDateStr(),
      createdAt: new Date().toISOString(),
    });
    window.location.href = "/login";
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-violet-100 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">I&apos;m currently reading...</label>
          <div className="flex gap-2">
            <select
              value={book}
              onChange={(e) => setBook(e.target.value)}
              aria-label="Book"
              className="flex-1 min-w-0 px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500"
            >
              {BIBLE_BOOKS.map((b) => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
            <select
              value={chapter}
              onChange={(e) => setChapter(Number(e.target.value))}
              aria-label="Chapter"
              className="w-28 flex-shrink-0 px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500"
            >
              {Array.from({ length: chaptersInBook }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>Ch. {c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">I usually read about...</label>
          <div className="grid grid-cols-4 gap-2">
            {PACE_OPTIONS.map((p) => {
              const active = p.minutes === minutes;
              const ch = chaptersForMinutes(p.minutes);
              return (
                <button
                  key={p.minutes}
                  onClick={() => setMinutes(p.minutes)}
                  className={`py-3 border-2 rounded-lg text-center text-sm transition ${
                    active ? "border-violet-500 bg-violet-50" : "border-violet-200 hover:border-violet-500"
                  }`}
                >
                  <span className={`block font-bold ${active ? "text-violet-700" : "text-slate-900"}`}>{p.label}</span>
                  <span className={`block text-xs ${active ? "text-violet-500" : "text-slate-500"}`}>
                    {ch} chapter{ch === 1 ? "" : "s"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live projection — every number below is computed */}
        <div className="bg-violet-50 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-violet-700 uppercase tracking-wide">Your personalized plan</h4>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Picking up from</span>
            <span className="font-semibold text-slate-900 text-right">{book}, Chapter {chapter}</span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">Chapters remaining</span>
            <span className="font-semibold text-slate-900 text-right">
              {remaining.toLocaleString("en-US")} to Revelation
            </span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">At your pace (~{realMinutes} min/day)</span>
            <span className="font-semibold text-slate-900 text-right">~{days.toLocaleString("en-US")} days</span>
          </div>
          <hr className="border-violet-200" />
          <div className="flex justify-between gap-3 text-sm bg-white -mx-2 px-3 py-2 rounded-lg">
            <span className="text-violet-600 font-semibold">You&apos;ll finish by</span>
            <span className="font-bold text-violet-700 text-right">
              {finishDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-500">By this Christmas</span>
            <span className="font-medium text-slate-700 text-right">{christmasSpot}</span>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 bg-violet-700 text-white py-3 rounded-lg hover:bg-violet-800 transition font-semibold"
        >
          Pick Up Where I Am <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
