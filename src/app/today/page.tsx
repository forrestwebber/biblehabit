"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Flame,
  ArrowRight,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  getGlobalChapterIndex,
  getBookAndChapter,
  chaptersRemaining,
} from "@/lib/bible-data";
import {
  getPlan,
  markDayComplete,
  isDayComplete,
  getCurrentStreak,
  getTotalChaptersRead,
  formatDate,
} from "@/lib/reading-store";

// Fetch KJV text from the free Bible API
async function fetchChapterText(
  book: string,
  chapter: number
): Promise<{ verses: { verse: number; text: string }[] } | null> {
  try {
    // Use bible-api.com (free, no key needed, supports KJV)
    const bookSlug = book.toLowerCase().replace(/\s+/g, "+");
    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=kjv`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.verses) {
      return {
        verses: data.verses.map((v: { verse: number; text: string }) => ({
          verse: v.verse,
          text: v.text.trim(),
        })),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function TodayPage() {
  const [plan, setPlanState] = useState<ReturnType<typeof getPlan>>(null);
  const [loading, setLoading] = useState(true);
  const [chapterTexts, setChapterTexts] = useState<
    Map<string, { verses: { verse: number; text: string }[] }>
  >(new Map());
  const [currentChapterView, setCurrentChapterView] = useState(0); // index within today's chapters
  const [todayDone, setTodayDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalRead, setTotalRead] = useState(0);

  // Calculate today's reading
  const getTodayInfo = useCallback(() => {
    if (!plan) return null;
    const startDate = new Date(plan.startDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceStart = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dayNumber = Math.max(0, daysSinceStart);

    const globalStart =
      getGlobalChapterIndex(plan.startBook, plan.startChapter) +
      dayNumber * plan.chaptersPerDay;
    const globalEnd = Math.min(
      globalStart + plan.chaptersPerDay - 1,
      TOTAL_CHAPTERS - 1
    );

    const chapters: { book: string; chapter: number; globalIndex: number }[] =
      [];
    for (let i = globalStart; i <= globalEnd && i < TOTAL_CHAPTERS; i++) {
      const bc = getBookAndChapter(i);
      chapters.push({ book: bc.book, chapter: bc.chapter, globalIndex: i });
    }

    const totalChapters = chaptersRemaining(plan.startBook, plan.startChapter);
    const totalDays = Math.ceil(totalChapters / plan.chaptersPerDay);
    const progressPercent = Math.min(
      100,
      Math.round(((dayNumber * plan.chaptersPerDay) / totalChapters) * 100)
    );

    return {
      dayNumber: dayNumber + 1,
      totalDays,
      chapters,
      progressPercent,
      globalStart,
      globalEnd,
    };
  }, [plan]);

  useEffect(() => {
    const savedPlan = getPlan();
    setPlanState(savedPlan);
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());

    const todayStr = formatDate(new Date());
    setTodayDone(isDayComplete(todayStr));
    setLoading(false);
  }, []);

  const todayInfo = getTodayInfo();

  // Fetch chapter text when plan loads or chapter view changes
  useEffect(() => {
    if (!todayInfo || todayInfo.chapters.length === 0) return;
    const ch = todayInfo.chapters[currentChapterView];
    if (!ch) return;
    const key = `${ch.book}-${ch.chapter}`;
    if (chapterTexts.has(key)) return;

    fetchChapterText(ch.book, ch.chapter).then((data) => {
      if (data) {
        setChapterTexts((prev) => new Map(prev).set(key, data));
      }
    });
  }, [todayInfo, currentChapterView, chapterTexts]);

  const handleMarkDone = () => {
    if (!todayInfo) return;
    const todayStr = formatDate(new Date());
    const indices = todayInfo.chapters.map((c) => c.globalIndex);
    markDayComplete(todayStr, indices);
    setTodayDone(true);
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="flex items-center justify-center py-32">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="text-center py-32 px-6 max-w-lg mx-auto">
          <BookOpen className="h-16 w-16 text-violet-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            No Reading Plan Yet
          </h1>
          <p className="text-slate-500 mb-8">
            Create a reading plan first, then come back here for your daily
            reading.
          </p>
          <a
            href="/plans"
            className="inline-flex items-center gap-2 bg-violet-700 text-white px-6 py-3 rounded-lg hover:bg-violet-800 transition font-semibold"
          >
            Create Your Plan <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  if (!todayInfo || todayInfo.chapters.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="text-center py-32 px-6 max-w-lg mx-auto">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            You&apos;ve Finished!
          </h1>
          <p className="text-slate-500 mb-8">
            Congratulations! You&apos;ve completed the entire Bible.
          </p>
          <a
            href="/profile"
            className="inline-flex items-center gap-2 bg-violet-700 text-white px-6 py-3 rounded-lg hover:bg-violet-800 transition font-semibold"
          >
            View Your Progress <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  const currentCh = todayInfo.chapters[currentChapterView];
  const chapterKey = currentCh ? `${currentCh.book}-${currentCh.chapter}` : "";
  const chapterData = chapterTexts.get(chapterKey);

  const firstCh = todayInfo.chapters[0];
  const lastCh = todayInfo.chapters[todayInfo.chapters.length - 1];
  const headerLabel =
    firstCh.book === lastCh.book
      ? `${firstCh.book} ${firstCh.chapter}${
          firstCh.chapter !== lastCh.chapter ? `–${lastCh.chapter}` : ""
        }`
      : `${firstCh.book} ${firstCh.chapter} – ${lastCh.book} ${lastCh.chapter}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Reading Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-violet-300 uppercase tracking-wide">
                Day {todayInfo.dayNumber} of {todayInfo.totalDays}
              </p>
              <h1 className="text-lg font-bold">{headerLabel}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Your streak</p>
              <p className="text-2xl font-bold text-violet-400 flex items-center gap-1">
                <Flame className="h-5 w-5" /> {streak}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2">
            <div
              className="bg-violet-600 h-2 rounded-r-full transition-all duration-500"
              style={{ width: `${todayInfo.progressPercent}%` }}
            />
          </div>

          {/* Chapter tabs */}
          {todayInfo.chapters.length > 1 && (
            <div className="flex items-center border-b border-violet-100 px-4 gap-1 overflow-x-auto">
              {todayInfo.chapters.map((ch, i) => (
                <button
                  key={ch.globalIndex}
                  onClick={() => setCurrentChapterView(i)}
                  className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                    i === currentChapterView
                      ? "border-violet-600 text-violet-700"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {ch.book} {ch.chapter}
                </button>
              ))}
            </div>
          )}

          {/* Chapter text */}
          <div className="px-6 py-6">
            {currentCh && (
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                {currentCh.book} {currentCh.chapter}{" "}
                <span className="text-sm font-normal text-slate-400">KJV</span>
              </h2>
            )}

            {chapterData ? (
              <div className="text-slate-700 leading-relaxed space-y-2 text-[15px]">
                {chapterData.verses.map((v) => (
                  <p key={v.verse}>
                    <sup className="text-violet-400 mr-1 text-xs font-semibold">
                      {v.verse}
                    </sup>
                    {v.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-slate-100 rounded animate-pulse"
                    style={{ width: `${70 + Math.random() * 30}%` }}
                  />
                ))}
                <p className="text-sm text-slate-400 mt-4">
                  Loading chapter text...
                </p>
              </div>
            )}
          </div>

          {/* Navigation between chapters */}
          {todayInfo.chapters.length > 1 && (
            <div className="px-6 pb-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setCurrentChapterView(Math.max(0, currentChapterView - 1))
                }
                disabled={currentChapterView === 0}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-violet-600 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-xs text-slate-400">
                {currentChapterView + 1} of {todayInfo.chapters.length}
              </span>
              <button
                onClick={() =>
                  setCurrentChapterView(
                    Math.min(
                      todayInfo.chapters.length - 1,
                      currentChapterView + 1
                    )
                  )
                }
                disabled={
                  currentChapterView === todayInfo.chapters.length - 1
                }
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-violet-600 disabled:opacity-30 transition"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Mark as Done */}
          <div className="px-6 py-4 border-t border-violet-100">
            {todayDone ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-lg text-green-700 font-semibold">
                <CheckCircle className="h-5 w-5" /> Today&apos;s reading
                complete!
              </div>
            ) : (
              <button
                onClick={handleMarkDone}
                className="w-full flex items-center justify-center gap-2 bg-violet-700 text-white py-3 rounded-lg hover:bg-violet-800 transition font-semibold"
              >
                <CheckCircle className="h-4 w-4" /> Mark as Done
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white rounded-xl p-4 text-center border border-violet-100">
            <p className="text-2xl font-bold text-violet-600">{streak}</p>
            <p className="text-xs text-slate-500 mt-1">Day Streak</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-violet-100">
            <p className="text-2xl font-bold text-violet-600">{totalRead}</p>
            <p className="text-xs text-slate-500 mt-1">Chapters Read</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-violet-100">
            <p className="text-2xl font-bold text-violet-600">
              {todayInfo.progressPercent}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Complete</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex gap-3 mt-6 mb-8">
          <a
            href="/plans"
            className="flex-1 text-center py-3 bg-white border border-violet-100 rounded-lg text-sm text-slate-600 hover:bg-violet-50 transition font-medium"
          >
            Adjust Plan
          </a>
          <a
            href="/profile"
            className="flex-1 text-center py-3 bg-white border border-violet-100 rounded-lg text-sm text-slate-600 hover:bg-violet-50 transition font-medium"
          >
            View Progress
          </a>
        </div>
      </div>
    </div>
  );
}
