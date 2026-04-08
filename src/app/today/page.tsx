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
  Pause,
  X,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import BibleAffiliate from "@/components/BibleAffiliate";
import SignUpGate from "@/components/SignUpGate";
import CompletionCelebration from "@/components/CompletionCelebration";
import { supabase } from "@/lib/supabase";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  getGlobalChapterIndex,
  getBookAndChapter,
  chaptersRemaining,
  getChaptersInPlan,
  getPlanEndGlobal,
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
import {
  getSubPlans,
  getSubPlanChapterToday,
  markSubPlanDone,
  isSubPlanDoneToday,
  pauseSubPlan,
  removeSubPlan,
  addSubPlan,
  DEVOTIONAL_PRESETS,
  type SubPlan,
} from "@/lib/sub-plans";
import { addXP, getLevelInfo, XP_PER_CHAPTER, type LevelInfo } from "@/lib/xp-store";
import { saveHighlight } from "@/lib/highlights-store";

// ─── Translations ────────────────────────────────────────────────
const TRANSLATIONS = [
  { id: "kjv", label: "KJV", name: "King James" },
  { id: "web", label: "WEB", name: "World English" },
  { id: "asv", label: "ASV", name: "American Standard" },
  { id: "bbe", label: "BBE", name: "Basic English" },
];
const DEFAULT_TRANSLATION = "kjv";
const TRANSLATION_STORAGE_KEY = "biblehabit_translation";

function getSavedTranslation(): string {
  if (typeof window === "undefined") return DEFAULT_TRANSLATION;
  return localStorage.getItem(TRANSLATION_STORAGE_KEY) ?? DEFAULT_TRANSLATION;
}

async function fetchChapterText(
  book: string,
  chapter: number,
  translation = DEFAULT_TRANSLATION
): Promise<{ verses: { verse: number; text: string }[] } | null> {
  try {
    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${translation}`
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

function getNextBook(bookName: string): string | null {
  const idx = BIBLE_BOOKS.findIndex((b) => b.name === bookName);
  return idx >= 0 && idx < BIBLE_BOOKS.length - 1
    ? BIBLE_BOOKS[idx + 1].name
    : null;
}

function getBookFinishMessage(bookName: string): { msg: string; emoji: string } {
  if (bookName === "Revelation") return { msg: "You finished the entire Bible! This is extraordinary.", emoji: "🏆" };
  if (bookName === "Malachi") return { msg: "You completed the Old Testament. The New Testament awaits!", emoji: "✨" };
  if (["Matthew", "Mark", "Luke", "John"].includes(bookName)) return { msg: `You finished the Gospel of ${bookName}!`, emoji: "✝️" };
  if (bookName === "Psalms") return { msg: "All 150 Psalms — what a devotional journey!", emoji: "🎵" };
  if (bookName === "Proverbs") return { msg: "31 chapters of Proverbs. Solomon would be proud.", emoji: "🦉" };
  return { msg: `You finished ${bookName}! Keep the momentum going.`, emoji: "🎉" };
}

// ─── Main component ──────────────────────────────────────────────
export default function TodayPage() {
  const [plan, setPlanState] = useState<ReturnType<typeof getPlan>>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [translation, setTranslation] = useState<string>(DEFAULT_TRANSLATION);
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    xpEarned: number; levelInfo: LevelInfo; chaptersCount: number;
  } | null>(null);

  // "Keep Going" / "Go Back" state
  const [extraOffset, setExtraOffset] = useState(0); // 0=today, 1=next day, -1=prev day
  const [extraView, setExtraView] = useState(0);

  // Sub-plans (Psalms, Proverbs, John, etc.)
  const [subPlans, setSubPlans] = useState<SubPlan[]>([]);
  const [subPlanDone, setSubPlanDone] = useState<Set<string>>(new Set());
  const [showDevotionalPicker, setShowDevotionalPicker] = useState(false);

  // Verse selection / sharing / highlights
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [highlightSaved, setHighlightSaved] = useState(false);

  const refreshStats = useCallback(() => {
    setPlanState(getPlan());
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setTodayDone(isDayComplete(formatDate(new Date())));
  }, []);

  const refreshSubPlans = useCallback(() => {
    const plans = getSubPlans();
    setSubPlans(plans.filter((p) => !p.paused));
    const doneSet = new Set<string>();
    for (const p of plans) {
      if (!p.paused && isSubPlanDoneToday(p.id)) doneSet.add(p.id);
    }
    setSubPlanDone(doneSet);
  }, []);

  // Calculate today's reading
  const getTodayInfo = useCallback(
    (planData = plan) => {
      if (!planData) return null;
      const planEndGlobal = getPlanEndGlobal(planData.endBook);
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

      // Plan complete — return null so "You've finished" screen shows
      if (globalStart > planEndGlobal) return null;

      const globalEnd = Math.min(
        globalStart + planData.chaptersPerDay - 1,
        planEndGlobal
      );

      const chapters: { book: string; chapter: number; globalIndex: number }[] = [];
      for (let i = globalStart; i <= globalEnd; i++) {
        const bc = getBookAndChapter(i);
        chapters.push({ book: bc.book, chapter: bc.chapter, globalIndex: i });
      }

      const totalChapters = getChaptersInPlan(planData.startBook, planData.startChapter, planData.endBook);
      const totalDays = Math.ceil(totalChapters / planData.chaptersPerDay);

      return { dayNumber: dayNumber + 1, totalDays, chapters, globalStart, globalEnd };
    },
    [plan]
  );

  // Reading for any day offset (for "Keep Going" / "Go Back")
  const getOffsetInfo = useCallback(
    (offset: number) => {
      if (!plan) return null;
      const planEndGlobal = getPlanEndGlobal(plan.endBook);
      const startDate = new Date(plan.startDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / 86400000
      );
      const targetDay = Math.max(0, daysSinceStart) + offset;
      if (targetDay < 0) return null;

      const globalStart =
        getGlobalChapterIndex(plan.startBook, plan.startChapter) +
        targetDay * plan.chaptersPerDay;
      if (globalStart > planEndGlobal) return null;
      const globalEnd = Math.min(
        globalStart + plan.chaptersPerDay - 1,
        planEndGlobal
      );

      const chapters: { book: string; chapter: number; globalIndex: number }[] = [];
      for (let i = globalStart; i <= globalEnd; i++) {
        const bc = getBookAndChapter(i);
        chapters.push({ book: bc.book, chapter: bc.chapter, globalIndex: i });
      }
      if (!chapters.length) return null;

      const first = chapters[0];
      const last = chapters[chapters.length - 1];
      const label =
        first.book === last.book
          ? `${first.book} ${first.chapter}${chapters.length > 1 ? `–${last.chapter}` : ""}`
          : `${first.book} ${first.chapter} – ${last.book} ${last.chapter}`;

      return { chapters, label, dayType: offset > 0 ? "Reading Ahead" : "Re-reading" };
    },
    [plan]
  );

  // Tomorrow preview
  const getTomorrowPreview = useCallback(
    (planData = plan) => {
      if (!planData) return null;
      const info = (() => {
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
        const globalEnd = Math.min(globalStart + planData.chaptersPerDay - 1, TOTAL_CHAPTERS - 1);
        const chapters: { book: string; chapter: number }[] = [];
        for (let i = globalStart; i <= globalEnd && i < TOTAL_CHAPTERS; i++) {
          const bc = getBookAndChapter(i);
          chapters.push({ book: bc.book, chapter: bc.chapter });
        }
        if (!chapters.length) return null;
        const first = chapters[0];
        const last = chapters[chapters.length - 1];
        const label =
          first.book === last.book
            ? `${first.book} ${first.chapter}${first.chapter !== last.chapter ? `–${last.chapter}` : ""}`
            : `${first.book} ${first.chapter} – ${last.book} ${last.chapter}`;
        return { label, count: chapters.length };
      })();
      return info;
    },
    [plan]
  );

  useEffect(() => {
    setTranslation(getSavedTranslation());
    const savedPlan = getPlan();
    setPlanState(savedPlan);
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setTodayDone(isDayComplete(formatDate(new Date())));
    setLoading(false);
    refreshSubPlans();

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
  }, [refreshStats, refreshSubPlans]);

  const todayInfo = getTodayInfo();
  const tomorrowPreview = getTomorrowPreview();
  const extraInfo = extraOffset !== 0 ? getOffsetInfo(extraOffset) : null;

  // Actual progress % using chapters read (respects endBook)
  const planTotalChapters = plan
    ? getChaptersInPlan(plan.startBook, plan.startChapter, plan.endBook)
    : 1;
  const actualProgressPercent =
    totalRead === 0
      ? 0
      : Math.max(1, Math.min(100, Math.round((totalRead / planTotalChapters) * 100)));

  // Book finish detection
  const lastCh = todayInfo?.chapters[todayInfo.chapters.length - 1];
  const lastChBookData = lastCh ? BIBLE_BOOKS.find((b) => b.name === lastCh.book) : null;
  const bookJustFinished =
    todayDone && !!lastCh && !!lastChBookData && lastCh.chapter === lastChBookData.chapters;
  const nextBookName = bookJustFinished && lastCh ? getNextBook(lastCh.book) : null;
  const bookFinishInfo =
    bookJustFinished && lastCh ? getBookFinishMessage(lastCh.book) : null;

  // Fetch chapter text for today's reading
  useEffect(() => {
    if (!todayInfo || todayInfo.chapters.length === 0) return;
    const ch = todayInfo.chapters[currentChapterView];
    if (!ch) return;
    const key = `${translation}-${ch.book}-${ch.chapter}`;
    if (chapterTexts.has(key)) return;
    fetchChapterText(ch.book, ch.chapter, translation).then((data) => {
      if (data) setChapterTexts((prev) => new Map(prev).set(key, data));
    });
  }, [todayInfo, currentChapterView, chapterTexts, translation]);

  // Fetch chapter text for extra (keep going / go back) reading
  useEffect(() => {
    if (!extraInfo || extraOffset === 0) return;
    const ch = extraInfo.chapters[extraView] ?? extraInfo.chapters[0];
    if (!ch) return;
    const key = `${translation}-${ch.book}-${ch.chapter}`;
    if (chapterTexts.has(key)) return;
    fetchChapterText(ch.book, ch.chapter, translation).then((data) => {
      if (data) setChapterTexts((prev) => new Map(prev).set(key, data));
    });
  }, [extraInfo, extraView, extraOffset, chapterTexts, translation]);

  function handleTranslationChange(id: string) {
    setTranslation(id);
    localStorage.setItem(TRANSLATION_STORAGE_KEY, id);
  }

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

    // XP + celebration
    const xpEarned = addXP(todayInfo.chapters.length * XP_PER_CHAPTER);
    const levelInfo = getLevelInfo(xpEarned);
    setCelebrationData({ xpEarned: todayInfo.chapters.length * XP_PER_CHAPTER, levelInfo, chaptersCount: todayInfo.chapters.length });
    setShowCelebration(true);

    if (isSignedIn === false) {
      if (todayInfo.dayNumber >= 3 || newStreak >= 3) setShowSignUpGate(true);
    }
  };

  const handleSubPlanDone = (planId: string) => {
    markSubPlanDone(planId);
    setSubPlanDone((prev) => new Set([...prev, planId]));
  };

  const handlePauseSubPlan = (planId: string) => {
    pauseSubPlan(planId);
    refreshSubPlans();
  };

  const handleRemoveSubPlan = (planId: string) => {
    removeSubPlan(planId);
    refreshSubPlans();
  };

  // ─── Loading / no plan states ─────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading…</p>
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
          <h1 className="text-2xl font-bold text-slate-900 mb-4">No Reading Plan Yet</h1>
          <p className="text-slate-500 mb-8">
            Create a reading plan first, then come back here for your daily reading.
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
          <h1 className="text-2xl font-bold text-slate-900 mb-4">You&apos;ve Finished!</h1>
          <p className="text-slate-500 mb-8">
            Congratulations! You&apos;ve completed your reading plan.
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

  // ─── Render helpers ───────────────────────────────────────────
  const currentCh = todayInfo.chapters[currentChapterView];
  const chapterKey = currentCh ? `${translation}-${currentCh.book}-${currentCh.chapter}` : "";
  const chapterData = chapterTexts.get(chapterKey);
  const translationLabel = TRANSLATIONS.find((t) => t.id === translation)?.label ?? "KJV";

  const firstCh = todayInfo.chapters[0];
  const headerLabel =
    firstCh.book === lastCh!.book
      ? `${firstCh.book} ${firstCh.chapter}${
          firstCh.chapter !== lastCh!.chapter ? `–${lastCh!.chapter}` : ""
        }`
      : `${firstCh.book} ${firstCh.chapter} – ${lastCh!.book} ${lastCh!.chapter}`;

  // Translation pill bar (shared between today and extra reading)
  const TranslationPicker = () => (
    <div className="px-5 pt-3 pb-0 flex items-center gap-1.5 flex-wrap">
      {TRANSLATIONS.map((t) => (
        <button
          key={t.id}
          onClick={() => handleTranslationChange(t.id)}
          title={t.name}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
            translation === t.id
              ? "bg-violet-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-500 hover:bg-violet-100 hover:text-violet-700"
          }`}
        >
          {t.label}
        </button>
      ))}
      <span className="text-xs text-slate-300 ml-1">· NIV &amp; ESV coming soon</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      {showSignUpGate && (
        <SignUpGate streak={streak} onDismiss={() => setShowSignUpGate(false)} />
      )}

      {showCelebration && celebrationData && (
        <CompletionCelebration
          dayNumber={todayInfo?.dayNumber ?? 1}
          chaptersCount={celebrationData.chaptersCount}
          xpEarned={celebrationData.xpEarned}
          streak={streak}
          levelInfo={celebrationData.levelInfo}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ─── COMPLETION STATE ─────────────────────────────────── */}
        {todayDone ? (
          <div className="mb-6 space-y-4">

            {/* Celebration card */}
            <div className="bg-gradient-to-br from-violet-700 to-violet-900 rounded-2xl p-6 text-white shadow-lg">
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
              <div className="bg-white/10 rounded-xl px-4 py-2.5 mb-4">
                <p className="text-sm font-medium text-violet-100">{streakMessage(streak)}</p>
              </div>
              <div className="mb-1">
                <div className="flex justify-between text-xs text-violet-200 mb-1.5">
                  <span>{totalRead} {totalRead === 1 ? "chapter" : "chapters"} read</span>
                  <span>{actualProgressPercent}% of plan complete</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-yellow-300 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${actualProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Book finished! Banner */}
            {bookJustFinished && lastCh && bookFinishInfo && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-lg font-bold text-amber-900 mb-1">
                  {bookFinishInfo.emoji} {bookFinishInfo.msg}
                </p>
                <p className="text-sm text-amber-700 mb-3">
                  Every book you finish is a milestone to be proud of.
                </p>
                <div className="flex flex-wrap gap-2">
                  {nextBookName && (
                    <a
                      href="/plans"
                      className="inline-flex items-center gap-2 bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-700 transition active:scale-95"
                    >
                      Continue to {nextBookName} <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                  {lastCh.book === "Malachi" && (
                    <a
                      href="/plans"
                      className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-violet-700 transition"
                    >
                      Start the New Testament <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                  {lastCh.book === "Revelation" && (
                    <a
                      href="/plans"
                      className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-violet-700 transition"
                    >
                      Start again from Genesis <ArrowRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Tomorrow preview — clickable to read ahead */}
            {tomorrowPreview && (
              <button
                onClick={() => { setExtraOffset(1); setExtraView(0); }}
                className="w-full bg-white rounded-2xl border border-violet-100 p-5 flex items-center justify-between shadow-sm hover:border-violet-300 hover:shadow-md transition-all active:scale-[0.99] text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-1">
                    Up Next — Read Ahead?
                  </p>
                  <p className="text-base font-bold text-slate-900">{tomorrowPreview.label}</p>
                  <p className="text-sm text-violet-500 font-medium mt-1 flex items-center gap-1">
                    Read now <ChevronRight className="h-3.5 w-3.5" />
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-violet-300 flex-shrink-0" />
              </button>
            )}

            {/* Keep Going / Go Back */}
            {extraOffset === 0 ? (
              <div className="space-y-2">
                <button
                  onClick={() => { setExtraOffset(1); setExtraView(0); }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-violet-700 hover:bg-violet-800 text-white rounded-xl font-bold text-base active:scale-95 transition-all shadow-lg shadow-violet-200"
                >
                  Keep Going <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => { setExtraOffset(-1); setExtraView(0); }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-medium text-sm active:scale-95 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> Re-read previous
                </button>
              </div>
            ) : (
              /* Extra reading panel */
              <div className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden">
                {/* Nav header */}
                <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
                  <button
                    onClick={() => { setExtraOffset((o) => o - 1); setExtraView(0); }}
                    disabled={extraOffset <= -30}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-white disabled:opacity-30 transition"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {extraOffset === 1 ? "Today" : extraOffset === -1 ? "Further back" : "Back"}
                  </button>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">{extraInfo?.dayType}</p>
                    <p className="text-sm font-bold">{extraInfo?.label}</p>
                  </div>
                  <button
                    onClick={() => { setExtraOffset((o) => o + 1); setExtraView(0); }}
                    disabled={extraOffset >= 30}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-white disabled:opacity-30 transition"
                  >
                    {extraOffset === -1 ? "Today" : "Ahead"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => { setExtraOffset(0); setExtraView(0); }}
                  className="w-full text-center text-xs text-violet-500 py-2 border-b border-slate-100 hover:text-violet-700 transition"
                >
                  ← Back to today&apos;s summary
                </button>

                <TranslationPicker />

                {extraInfo && (
                  <>
                    {extraInfo.chapters.length > 1 && (
                      <div className="flex overflow-x-auto border-b border-slate-100 px-4 gap-1 mt-2">
                        {extraInfo.chapters.map((ch, i) => (
                          <button
                            key={i}
                            onClick={() => setExtraView(i)}
                            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${
                              i === extraView
                                ? "border-violet-600 text-violet-700"
                                : "border-transparent text-slate-400"
                            }`}
                          >
                            {ch.book} {ch.chapter}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="px-5 py-5">
                      {(() => {
                        const ch = extraInfo.chapters[extraView] ?? extraInfo.chapters[0];
                        const key = ch ? `${translation}-${ch.book}-${ch.chapter}` : "";
                        const data = chapterTexts.get(key);
                        if (!ch) return null;
                        return data ? (
                          <div>
                            <h3 className="text-base font-bold text-slate-900 mb-4">
                              {ch.book} {ch.chapter}{" "}
                              <span className="text-sm font-normal text-slate-400">
                                {translationLabel}
                              </span>
                            </h3>
                            <div className="text-slate-700 leading-relaxed space-y-2 text-[15px]">
                              {data.verses.map((v) => (
                                <p key={v.verse}>
                                  <sup className="text-violet-400 mr-1 text-xs font-semibold">
                                    {v.verse}
                                  </sup>
                                  {v.text}
                                </p>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div
                                key={i}
                                className="h-4 bg-slate-100 rounded animate-pulse"
                                style={{ width: `${65 + (i * 8) % 30}%` }}
                              />
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Quick links */}
            <div className="flex gap-3">
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
          /* ─── READING CARD (not done today) ─────────────────────── */
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
                style={{ width: `${actualProgressPercent}%` }}
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

            {/* Translation picker */}
            <TranslationPicker />

            {/* Chapter text */}
            <div className="px-6 py-6">
              {currentCh && (
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    {currentCh.book} {currentCh.chapter}{" "}
                    <span className="text-sm font-normal text-slate-400">{translationLabel}</span>
                  </h2>
                  {selectedVerses.size > 0 && (
                    <button
                      onClick={() => setSelectedVerses(new Set())}
                      className="text-xs text-slate-400 hover:text-slate-600 transition"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              )}

              {selectedVerses.size === 0 && (
                <p className="text-xs text-violet-400 mb-3 italic">Tap any verse to highlight &amp; share</p>
              )}

              {chapterData ? (
                <div className="text-slate-700 leading-relaxed space-y-1 text-[15px]">
                  {chapterData.verses.map((v) => {
                    const isSelected = selectedVerses.has(v.verse);
                    return (
                      <p
                        key={v.verse}
                        onClick={() => {
                          setSelectedVerses((prev) => {
                            const next = new Set(prev);
                            if (next.has(v.verse)) next.delete(v.verse);
                            else next.add(v.verse);
                            return next;
                          });
                          setHighlightSaved(false);
                        }}
                        className={`px-2 py-1.5 rounded-lg cursor-pointer transition-all select-none ${
                          isSelected
                            ? "bg-yellow-100 border-l-4 border-yellow-400 text-slate-900"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <sup className={`mr-1.5 text-xs font-bold ${isSelected ? "text-yellow-600" : "text-violet-400"}`}>
                          {v.verse}
                        </sup>
                        {v.text}
                      </p>
                    );
                  })}
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
                  <p className="text-sm text-slate-400 mt-4">Loading chapter text…</p>
                </div>
              )}
            </div>

            {/* Navigation between chapters */}
            {todayInfo.chapters.length > 1 && (
              <div className="px-6 pb-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentChapterView(Math.max(0, currentChapterView - 1))}
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
                      Math.min(todayInfo.chapters.length - 1, currentChapterView + 1)
                    )
                  }
                  disabled={currentChapterView === todayInfo.chapters.length - 1}
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

        {/* ─── SUB-PLANS (Daily devotionals) ───────────────────── */}
        {subPlans.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Daily Devotionals
            </p>
            <div className="space-y-3">
              {subPlans.map((sp) => {
                const todayChapter = getSubPlanChapterToday(sp);
                const isDone = subPlanDone.has(sp.id);
                return (
                  <div
                    key={sp.id}
                    className={`bg-white rounded-xl border p-4 flex items-center justify-between transition ${
                      isDone ? "border-green-200 opacity-75" : "border-violet-100"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-violet-500 font-semibold uppercase tracking-wide">
                        {sp.label}
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {sp.book} {todayChapter}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isDone ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                          <CheckCircle className="h-4 w-4" /> Done
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSubPlanDone(sp.id)}
                          className="bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-800 active:scale-95 transition-all"
                        >
                          Done
                        </button>
                      )}
                      <button
                        onClick={() => handlePauseSubPlan(sp.id)}
                        title="Pause"
                        className="text-slate-300 hover:text-slate-500 transition"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveSubPlan(sp.id)}
                        title="Remove"
                        className="text-slate-300 hover:text-red-400 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <a
              href="/plans"
              className="block text-center text-xs text-violet-500 mt-3 hover:text-violet-700 transition"
            >
              + Manage devotional readings
            </a>
          </div>
        )}

        {/* ─── STATS BAR (not done) ────────────────────────────── */}
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
              <p className="text-2xl font-bold text-violet-600">{actualProgressPercent}%</p>
              <p className="text-xs text-slate-500 mt-1">Complete</p>
            </div>
          </div>
        )}

        {/* ─── SIGN IN NUDGE ───────────────────────────────────── */}
        {isSignedIn === false && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-5 py-4 flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-violet-700">Sign in to save your streak across devices.</p>
            <a
              href="/login"
              className="flex-shrink-0 bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-violet-800 transition"
            >
              Sign In
            </a>
          </div>
        )}

        {/* ─── ADD DEVOTIONAL NUDGE / INLINE PICKER ────────────── */}
        {subPlans.length === 0 && !showDevotionalPicker && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 mb-4">
            <p className="text-sm font-semibold text-slate-700 mb-1">
              📖 Add daily devotionals
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Stack a short daily reading alongside your main plan — Psalms, Proverbs, John, and more.
            </p>
            <button
              onClick={() => setShowDevotionalPicker(true)}
              className="text-xs text-violet-600 font-semibold hover:text-violet-800 transition"
            >
              Choose a devotional →
            </button>
          </div>
        )}

        {/* ─── INLINE DEVOTIONAL PICKER ────────────────────────── */}
        {showDevotionalPicker && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">Pick a devotional</p>
              <button onClick={() => setShowDevotionalPicker(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEVOTIONAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    const d = new Date();
                    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                    addSubPlan({ label: preset.label, book: preset.book, totalChapters: preset.totalChapters, chaptersPerDay: preset.chaptersPerDay, startDate: iso });
                    refreshSubPlans();
                    setShowDevotionalPicker(false);
                  }}
                  className="flex items-center gap-2 bg-white border border-violet-100 rounded-xl px-3 py-2 text-left hover:border-violet-400 active:scale-95 transition-all"
                >
                  <span className="text-xl">{preset.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{preset.label}</p>
                    <p className="text-[10px] text-slate-400">{preset.book}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAffiliate && (
        <BibleAffiliate count={2} heading="Own a Great Bible" variant="violet" />
      )}

      {/* ─── FLOATING VERSE ACTION BAR ─────────────────────────── */}
      {selectedVerses.size > 0 && currentCh && chapterData && (
        <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 max-w-sm w-full animate-slide-up">
            <span className="text-white text-sm font-semibold flex-1">
              {selectedVerses.size} verse{selectedVerses.size > 1 ? "s" : ""} selected
            </span>

            {/* Copy */}
            <button
              onClick={() => {
                const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
                const text = sortedVerses.map((vn) => {
                  const v = chapterData.verses.find((v) => v.verse === vn);
                  return v ? `[${currentCh.book} ${currentCh.chapter}:${vn}] ${v.text}` : "";
                }).filter(Boolean).join("\n");
                navigator.clipboard.writeText(text).catch(() => {});
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition active:scale-95"
            >
              Copy
            </button>

            {/* Share */}
            <button
              onClick={() => {
                const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
                const text = sortedVerses.map((vn) => {
                  const v = chapterData.verses.find((v) => v.verse === vn);
                  return v ? `"${v.text}" — ${currentCh.book} ${currentCh.chapter}:${vn}` : "";
                }).filter(Boolean).join("\n");
                if (navigator.share) {
                  navigator.share({ text, title: `${currentCh.book} ${currentCh.chapter}`, url: "https://biblehabit.co" }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text).catch(() => {});
                }
              }}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition active:scale-95"
            >
              Share
            </button>

            {/* Save highlight */}
            <button
              onClick={() => {
                if (highlightSaved) return;
                const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
                const text = sortedVerses.map((vn) => {
                  const v = chapterData.verses.find((v) => v.verse === vn);
                  return v?.text ?? "";
                }).filter(Boolean).join(" ");
                saveHighlight({ book: currentCh.book, chapter: currentCh.chapter, verses: sortedVerses, text });
                setHighlightSaved(true);
                setTimeout(() => { setSelectedVerses(new Set()); setHighlightSaved(false); }, 1200);
              }}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition active:scale-95 ${
                highlightSaved
                  ? "bg-green-500 text-white"
                  : "bg-yellow-400 hover:bg-yellow-300 text-slate-900"
              }`}
            >
              {highlightSaved ? "Saved ✓" : "Save"}
            </button>

            {/* Dismiss */}
            <button
              onClick={() => { setSelectedVerses(new Set()); setHighlightSaved(false); }}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
