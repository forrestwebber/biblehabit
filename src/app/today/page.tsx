"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Flame,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import BibleAffiliate from "@/components/BibleAffiliate";
import SignUpGate from "@/components/SignUpGate";
import { supabase } from "@/lib/supabase";
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
  syncProgress,
} from "@/lib/reading-store";

// Fetch KJV text from the free Bible API
async function fetchChapterText(
  book: string,
  chapter: number
): Promise<{ verses: { verse: number; text: string }[] } | null> {
  try {
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

function streakMessage(streak: number): string {
  if (streak >= 365) return "A full year of faithfulness!";
  if (streak >= 100) return "100 days! You're unstoppable.";
  if (streak >= 30) return "30 days strong — this is a habit.";
  if (streak >= 14) return "Two weeks in a row!";
  if (streak >= 7) return "One full week!";
  if (streak >= 3) return "3 days and counting.";
  if (streak >= 1) return "Great start — keep going!";
  return "Start your streak today.";
}

export default function TodayPage() {
  const [plan, setPlanState] = useState<ReturnType<typeof getPlan>>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [chapterTexts, setChapterTexts] = useState<
    Map<string, { verses: { verse: number; text: string }[] }>
  >(new Map());
  const [currentChapterView, setCurrentChapterView] = useState(0);
  const [todayDone, setTodayDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalRead, setTotalRead] = useState(0);
  const [showSignUpGate, setShowSignUpGate] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [showAffiliate, setShowAffiliate] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const refreshStats = useCallback(() => {
    setPlanState(getPlan());
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setTodayDone(isDayComplete(formatDate(new Date())));
  }, []);

  // Calculate today's reading
  const getTodayInfo = useCallback(
    (planData = plan) => {
      if (!planData) return null;
      const startDate = new Date(planData.startDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const dayNumber = Math.max(0, daysSinceStart);

      const globalStart =
        getGlobalChapterIndex(planData.startBook, planData.startChapter) +
        dayNumber * planData.chaptersPerDay;
      const globalEnd = Math.min(
        globalStart + planData.chaptersPerDay - 1,
        TOTAL_CHAPTERS - 1
      );

      const chapters: { book: string; chapter: number; globalIndex: number }[] =
        [];
      for (let i = globalStart; i <= globalEnd && i < TOTAL_CHAPTERS; i++) {
        const bc = getBookAndChapter(i);
        chapters.push({ book: bc.book, chapter: bc.chapter, globalIndex: i });
      }

      const totalChapters = chaptersRemaining(
        planData.startBook,
        planData.startChapter
      );
      const totalDays = Math.ceil(totalChapters / planData.chaptersPerDay);
      const progressPercent = Math.min(
        100,
        Math.round(((dayNumber * planData.chaptersPerDay) / totalChapters) * 100)
      );

      return {
        dayNumber: dayNumber + 1,
        totalDays,
        chapters,
        progressPercent,
        globalStart,
        globalEnd,
      };
    },
    [plan]
  );

  // Calculate tomorrow's reading preview
  const getTomorrowPreview = useCallback(
    (planData = plan) => {
      if (!planData) return null;
      const startDate = new Date(planData.startDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const tomorrowDay = Math.max(0, daysSinceStart) + 1;

      const globalStart =
        getGlobalChapterIndex(planData.startBook, planData.startChapter) +
        tomorrowDay * planData.chaptersPerDay;

      if (globalStart >= TOTAL_CHAPTERS) return null;

      const globalEnd = Math.min(
        globalStart + planData.chaptersPerDay - 1,
        TOTAL_CHAPTERS - 1
      );

      const chapters: { book: string; chapter: number }[] = [];
      for (let i = globalStart; i <= globalEnd && i < TOTAL_CHAPTERS; i++) {
        const bc = getBookAndChapter(i);
        chapters.push({ book: bc.book, chapter: bc.chapter });
      }

      if (chapters.length === 0) return null;

      const first = chapters[0];
      const last = chapters[chapters.length - 1];
      const label =
        first.book === last.book
          ? `${first.book} ${first.chapter}${
              first.chapter !== last.chapter ? `–${last.chapter}` : ""
            }`
          : `${first.book} ${first.chapter} – ${last.book} ${last.chapter}`;

      return { label, count: chapters.length };
    },
    [plan]
  );

  useEffect(() => {
    const savedPlan = getPlan();
    setPlanState(savedPlan);
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setTodayDone(isDayComplete(formatDate(new Date())));
    setLoading(false);

    supabase.auth.getSession().then(async ({ data }) => {
      const loggedIn = !!data.session?.user;
      setIsSignedIn(loggedIn);
      if (loggedIn) {
        setSyncing(true);
        await syncProgress();
        setSyncing(false);
        refreshStats();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const loggedIn = !!session?.user;
      setIsSignedIn(loggedIn);
      if (loggedIn) {
        setSyncing(true);
        await syncProgress();
        setSyncing(false);
        refreshStats();
      }
    });

    const affiliateShown =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("affiliate_shown")
        : null;
    if (!affiliateShown) {
      setShowAffiliate(true);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("affiliate_shown", "1");
      }
    }

    return () => subscription.unsubscribe();
  }, [refreshStats]);

  const todayInfo = getTodayInfo();
  const tomorrowPreview = getTomorrowPreview();

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
    setJustCompleted(true);
    const newStreak = getCurrentStreak();
    setStreak(newStreak);
    setTotalRead(getTotalChaptersRead());

    if (isSignedIn === false) {
      if (todayInfo.dayNumber >= 3 || newStreak >= 3) {
        setShowSignUpGate(true);
      }
    }
  };

  if (loading || syncing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">
            {syncing ? "Syncing your progress…" : "Loading…"}
          </p>
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

      {showSignUpGate && (
        <SignUpGate
          streak={streak}
          onDismiss={() => setShowSignUpGate(false)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Completion celebration state */}
        {todayDone ? (
          <div className="mb-6">
            {/* Celebration card */}
            <div className="bg-gradient-to-br from-violet-700 to-violet-900 rounded-2xl p-6 text-white shadow-lg mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-5 w-5 text-yellow-300" />
                    <span className="text-sm font-semibold text-violet-200">
                      {justCompleted ? "Just completed!" : "Already done today"}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold">{headerLabel}</h2>
                  <p className="text-violet-200 text-sm mt-1">
                    Day {todayInfo.dayNumber} of {todayInfo.totalDays}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3 text-center flex-shrink-0">
                  <div className="flex items-center gap-1.5 justify-center">
                    <Flame className="h-5 w-5 text-orange-300" />
                    <span className="text-2xl font-bold">{streak}</span>
                  </div>
                  <p className="text-xs text-violet-200 mt-0.5">day streak</p>
                </div>
              </div>

              {/* Streak milestone message */}
              <div className="bg-white/10 rounded-xl px-4 py-2.5 mb-4">
                <p className="text-sm font-medium text-violet-100">
                  {streakMessage(streak)}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mb-1">
                <div className="flex justify-between text-xs text-violet-200 mb-1.5">
                  <span>{totalRead} chapters read</span>
                  <span>{todayInfo.progressPercent}% complete</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-yellow-300 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${todayInfo.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tomorrow preview */}
            {tomorrowPreview && (
              <div className="bg-white rounded-2xl border border-violet-100 p-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-1">
                    Tomorrow
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {tomorrowPreview.label}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {tomorrowPreview.count}{" "}
                    {tomorrowPreview.count === 1 ? "chapter" : "chapters"}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-violet-200 flex-shrink-0" />
              </div>
            )}

            {/* Quick links */}
            <div className="flex gap-3 mt-4">
              <a
                href="/profile"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-700 text-white rounded-xl hover:bg-violet-800 transition font-semibold text-sm"
              >
                <TrendingUp className="h-4 w-4" /> View Progress
              </a>
              <a
                href="/plans"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-violet-100 text-slate-600 rounded-xl hover:bg-violet-50 transition font-medium text-sm"
              >
                Adjust Plan
              </a>
            </div>
          </div>
        ) : (
          /* Reading Card — shown when today is NOT done */
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden mb-6">
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
                      style={{ width: `${70 + (i * 7) % 30}%` }}
                    />
                  ))}
                  <p className="text-sm text-slate-400 mt-4">
                    Loading chapter text…
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
              <button
                onClick={handleMarkDone}
                className="w-full flex items-center justify-center gap-2 bg-violet-700 text-white py-3.5 rounded-xl hover:bg-violet-800 active:scale-95 transition-all font-semibold text-base"
              >
                <CheckCircle className="h-5 w-5" /> Mark Today Complete
              </button>
            </div>
          </div>
        )}

        {/* Stats bar — always visible */}
        {!todayDone && (
          <div className="grid grid-cols-3 gap-3 mb-6">
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
        )}

        {/* Sign in nudge for logged-out users */}
        {isSignedIn === false && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-5 py-4 flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-violet-700">
              Sign in to save your streak across devices.
            </p>
            <a
              href="/login"
              className="flex-shrink-0 bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-violet-800 transition"
            >
              Sign In
            </a>
          </div>
        )}
      </div>

      {showAffiliate && (
        <BibleAffiliate
          count={2}
          heading="Own a Great Bible"
          variant="violet"
        />
      )}
    </div>
  );
}
