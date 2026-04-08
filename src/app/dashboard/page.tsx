"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Flame, BookOpen, ArrowRight, CheckCircle, TrendingUp,
  TrendingDown, Calendar, Sparkles, ChevronRight, AlertTriangle,
  Zap, Clock, Target,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import { supabase } from "@/lib/supabase";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  getGlobalChapterIndex,
  getBookAndChapter,
  chaptersRemaining,
  getChaptersInPlan,
  getPlanEndGlobal,
  getTodaysReading,
  getMilestones,
} from "@/lib/bible-data";
import {
  getPlan, savePlan, getCurrentStreak, getTotalChaptersRead,
  isDayComplete, formatDate, syncProgress, getProgressAnalysis,
  type SavedPlan, type ProgressAnalysis,
} from "@/lib/reading-store";
import { getXP, getLevelInfo, type LevelInfo } from "@/lib/xp-store";

type User = { id: string; email?: string; name?: string; avatarUrl?: string };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getStreakMessage(streak: number): string {
  if (streak >= 365) return "A full year of daily scripture. Life-changing.";
  if (streak >= 100) return "100 days! You're in rare company";
  if (streak >= 50) return "50 days of consistency — incredible";
  if (streak >= 30) return "A full month! You're devoted.";
  if (streak >= 21) return "21 days — science says this is a habit now";
  if (streak >= 14) return "Two weeks strong";
  if (streak >= 7) return "One full week! This is becoming a habit";
  if (streak >= 3) return "3 days — you're building something real";
  if (streak >= 1) return "Day one — the journey begins!";
  return "Start your streak today";
}

function formatFinishDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function monthsDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

// ─── Onboarding ──────────────────────────────────────────────────

const QUICK_PICKS = [
  { label: "Entire Bible", desc: "Genesis to Revelation (66 books)", startBook: "Genesis", endBook: "Revelation" },
  { label: "New Testament", desc: "Matthew to Revelation", startBook: "Matthew", endBook: "Revelation" },
  { label: "Pick Up Mid-Book", desc: "Finish a book you've already started", startBook: "", endBook: "" },
  { label: "Custom Range", desc: "Choose your own start and end books", startBook: "", endBook: "" },
];

const BIBLE_GROUPS = [
  { name: "Torah", books: ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy"] },
  { name: "History", books: ["Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther"] },
  { name: "Poetry", books: ["Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon"] },
  { name: "Major Prophets", books: ["Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel"] },
  { name: "Minor Prophets", books: ["Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"] },
  { name: "Gospels & Acts", books: ["Matthew","Mark","Luke","John","Acts"] },
  { name: "Paul's Letters", books: ["Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon"] },
  { name: "Letters & Prophecy", books: ["Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"] },
];

function BookPicker({ selected, onSelect }: { selected: string; onSelect: (book: string) => void }) {
  return (
    <div className="space-y-3">
      {BIBLE_GROUPS.map((group) => (
        <div key={group.name}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{group.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.books.map((book) => (
              <button
                key={book}
                onClick={() => onSelect(book)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selected === book
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700"
                }`}
              >
                {book}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChapterPicker({ book, selected, onSelect }: { book: string; selected: number; onSelect: (ch: number) => void }) {
  const bookData = BIBLE_BOOKS.find((b) => b.name === book);
  const total = bookData?.chapters ?? 1;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Starting chapter in {book}</p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((ch) => (
          <button
            key={ch}
            onClick={() => onSelect(ch)}
            className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
              selected === ch
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700"
            }`}
          >
            {ch}
          </button>
        ))}
      </div>
    </div>
  );
}

const PACE_OPTIONS = [
  { minutes: 1, chaptersPerDay: 1, label: "1 min/day", sub: "~1 chapter/day · just start the habit" },
  { minutes: 5, chaptersPerDay: 2, label: "5 min/day", sub: "~2 chapters/day" },
  { minutes: 15, chaptersPerDay: 3, label: "15 min/day", sub: "~3 chapters/day" },
  { minutes: 30, chaptersPerDay: 5, label: "30 min/day", sub: "~5 chapters/day" },
];

function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Dashboard Page ───────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(-1); // -1 = has plan/done, 0-2 = onboarding

  // Stats
  const [streak, setStreak] = useState(0);
  const [totalRead, setTotalRead] = useState(0);
  const [todayDone, setTodayDone] = useState(false);
  const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);

  // Onboarding state
  const [obQuickPick, setObQuickPick] = useState(0);
  const [obStartBook, setObStartBook] = useState("Genesis");
  const [obStartChapter, setObStartChapter] = useState(1);
  const [obEndBook, setObEndBook] = useState("Revelation");
  const [obMinutesPerDay, setObMinutesPerDay] = useState(1);
  const [obChaptersPerDay, setObChaptersPerDay] = useState(1);
  const [obStartDate, setObStartDate] = useState(todayDateStr());

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
        return;
      }
      const u = data.session.user;
      setUser({
        id: u.id,
        email: u.email ?? undefined,
        name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? undefined,
        avatarUrl: u.user_metadata?.avatar_url ?? undefined,
      });

      // Load from localStorage immediately — don't block on sync
      const savedPlan = getPlan();
      if (!savedPlan) {
        setOnboardingStep(0);
      } else {
        setPlan(savedPlan);
        setStreak(getCurrentStreak());
        setTotalRead(getTotalChaptersRead());
        setTodayDone(isDayComplete(formatDate(new Date())));
        setAnalysis(getProgressAnalysis(savedPlan));
        setOnboardingStep(-1);
      }
      setLevelInfo(getLevelInfo(getXP()));
      setLoading(false);

      // Sync in background — refresh stats when done
      setSyncing(true);
      await syncProgress();
      setSyncing(false);
      const refreshedPlan = getPlan();
      if (refreshedPlan) {
        setPlan(refreshedPlan);
        setStreak(getCurrentStreak());
        setTotalRead(getTotalChaptersRead());
        setTodayDone(isDayComplete(formatDate(new Date())));
        setAnalysis(getProgressAnalysis(refreshedPlan));
      }
    });
  }, []);

  function refreshStats(p: SavedPlan) {
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setTodayDone(isDayComplete(formatDate(new Date())));
    setAnalysis(getProgressAnalysis(p));
  }

  // Computed: today's reading from plan
  const todayReading = useMemo(() => {
    if (!plan) return null;
    return getTodaysReading(
      plan.startBook,
      plan.startChapter,
      plan.chaptersPerDay,
      new Date(plan.startDate + "T00:00:00")
    );
  }, [plan]);

  // Computed: tomorrow's reading
  const tomorrowReading = useMemo(() => {
    if (!plan || !todayReading) return null;
    const planEnd = getPlanEndGlobal(plan.endBook);
    const startIdx = getGlobalChapterIndex(plan.startBook, plan.startChapter);
    const dayNum = todayReading.dayNumber; // 1-based today
    const tomorrowGlobal = startIdx + dayNum * plan.chaptersPerDay;
    if (tomorrowGlobal > planEnd) return null;
    const bc = getBookAndChapter(tomorrowGlobal);
    const bcEnd = getBookAndChapter(Math.min(tomorrowGlobal + plan.chaptersPerDay - 1, planEnd));
    if (bc.book === bcEnd.book) {
      return bc.chapter === bcEnd.chapter ? `${bc.book} ${bc.chapter}` : `${bc.book} ${bc.chapter}–${bcEnd.chapter}`;
    }
    return `${bc.book} ${bc.chapter} – ${bcEnd.book} ${bcEnd.chapter}`;
  }, [plan, todayReading]);

  // Computed: today's label
  const todayLabel = useMemo(() => {
    if (!todayReading) return "";
    const { book, startChapter, endChapter, endBook } = todayReading;
    if (endBook) return `${book} ${startChapter} – ${endBook} ${endChapter}`;
    if (startChapter === endChapter) return `${book} ${startChapter}`;
    return `${book} ${startChapter}–${endChapter}`;
  }, [todayReading]);

  // Computed: overall progress %
  const progressPct = useMemo(() => {
    if (!plan) return 0;
    const total = getChaptersInPlan(plan.startBook, plan.startChapter, plan.endBook);
    return total > 0 ? Math.min(100, Math.round((totalRead / total) * 100)) : 0;
  }, [plan, totalRead]);

  // Computed: current book
  const currentBookName = useMemo(() => {
    if (!plan || totalRead === 0) return plan?.startBook ?? "";
    const startIdx = getGlobalChapterIndex(plan.startBook, plan.startChapter);
    const { book } = getBookAndChapter(Math.min(startIdx + totalRead, TOTAL_CHAPTERS - 1));
    return book;
  }, [plan, totalRead]);

  // Computed: milestones
  const milestones = useMemo(() => {
    if (!plan) return [];
    return getMilestones(plan.startBook, plan.startChapter, plan.chaptersPerDay, new Date(plan.startDate + "T00:00:00")).slice(0, 3);
  }, [plan]);

  // Onboarding: finish date preview
  const obFinishDate = useMemo(() => {
    const total = (() => {
      const si = BIBLE_BOOKS.findIndex((b) => b.name === obStartBook);
      const ei = BIBLE_BOOKS.findIndex((b) => b.name === obEndBook);
      if (si === -1 || ei === -1 || ei < si) return 0;
      let t = 0;
      for (let i = si; i <= ei; i++) t += BIBLE_BOOKS[i].chapters;
      // Subtract chapters already passed in the starting book
      return t - (obStartChapter - 1);
    })();
    if (total === 0 || obChaptersPerDay === 0) return null;
    const days = Math.ceil(total / obChaptersPerDay);
    const d = new Date(obStartDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    return { d, days };
  }, [obStartBook, obStartChapter, obEndBook, obChaptersPerDay, obStartDate]);

  function handleQuickPick(idx: number) {
    setObQuickPick(idx);
    const qp = QUICK_PICKS[idx];
    if (qp.startBook) { setObStartBook(qp.startBook); setObEndBook(qp.endBook); }
    // Mid-book: endBook = startBook (just finish this one book)
    if (idx === 2) setObEndBook(obStartBook);
    setObStartChapter(1);
  }

  function handlePaceSelect(cpd: number, minutes: number) {
    setObChaptersPerDay(cpd);
    setObMinutesPerDay(minutes);
  }

  function handleStartPlan() {
    const newPlan: SavedPlan = {
      startBook: obStartBook,
      startChapter: obStartChapter,
      chaptersPerDay: obChaptersPerDay,
      startDate: obStartDate,
      createdAt: new Date().toISOString(),
      endBook: obEndBook !== "Revelation" ? obEndBook : undefined,
    };
    savePlan(newPlan);

    // Fire welcome email (fire-and-forget)
    if (user?.email) {
      const finishLabel = obFinishDate
        ? obFinishDate.d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : undefined;
      fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          startBook: obStartBook,
          startChapter: obStartChapter,
          chaptersPerDay: obChaptersPerDay,
          finishDate: finishLabel,
        }),
      }).catch(() => {});
    }

    setPlan(newPlan);
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setTodayDone(isDayComplete(formatDate(new Date())));
    setAnalysis(getProgressAnalysis(newPlan));
    setOnboardingStep(-1);
  }

  // ─── Loading ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">{syncing ? "Syncing your progress…" : "Loading…"}</p>
      </div>
    );
  }

  // ─── Onboarding Step 0 — Welcome ─────────────────────────────

  if (onboardingStep === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100 mb-6">
              <BookOpen className="w-8 h-8 text-violet-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Welcome to BibleHabit</h1>
            <p className="text-lg text-slate-500">Read scripture every day. Build a habit that lasts.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-8 space-y-5">
            {[
              { icon: <BookOpen className="w-5 h-5 text-violet-500" />, title: "As little as 1 minute a day", desc: "Pick your pace — 1 chapter/day takes just a few minutes. No pressure." },
              { icon: <Flame className="w-5 h-5 text-orange-500" />, title: "Track your streak", desc: "Every day you read counts. Watch your consistency grow over time." },
              { icon: <Calendar className="w-5 h-5 text-blue-500" />, title: "See your finish date", desc: "Know exactly when you'll finish. Stay motivated with a real goal." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">{icon}</div>
                <div>
                  <div className="font-semibold text-slate-800">{title}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setOnboardingStep(1)}
            className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition flex items-center justify-center gap-2"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Onboarding Step 1 — Choose range ────────────────────────

  if (onboardingStep === 1) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-violet-600 font-medium mb-3">
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              Step 1 of 2
            </div>
            <h2 className="text-3xl font-bold text-slate-900">What do you want to read?</h2>
            <p className="text-slate-500 mt-1">Choose a range or pick your own.</p>
          </div>

          <div className="space-y-3 mb-6">
            {QUICK_PICKS.map((qp, idx) => (
              <button
                key={qp.label}
                onClick={() => handleQuickPick(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition ${obQuickPick === idx ? "border-violet-600 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300"}`}
              >
                <div className="font-semibold text-slate-900">{qp.label}</div>
                <div className="text-sm text-slate-500 mt-0.5">{qp.desc}</div>
              </button>
            ))}
          </div>

          {/* Pick Up Mid-Book — book + chapter picker */}
          {obQuickPick === 2 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Which book are you in?</p>
                <BookPicker selected={obStartBook} onSelect={(b) => { setObStartBook(b); setObEndBook(b); setObStartChapter(1); }} />
              </div>
              <div className="border-t border-slate-100 pt-4">
                <ChapterPicker book={obStartBook} selected={obStartChapter} onSelect={setObStartChapter} />
              </div>
              <p className="text-xs text-slate-400">Finishes {obStartBook} from chapter {obStartChapter}. After completing, start a new plan for the next book.</p>
            </div>
          )}

          {/* Custom Range — start + end book pickers */}
          {obQuickPick === 3 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Start book</p>
                <BookPicker selected={obStartBook} onSelect={(b) => { setObStartBook(b); setObStartChapter(1); }} />
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">End book</p>
                <BookPicker selected={obEndBook} onSelect={setObEndBook} />
              </div>
            </div>
          )}

          <button
            onClick={() => setOnboardingStep(2)}
            className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
          >
            Next <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Onboarding Step 2 — Pace ─────────────────────────────────

  if (onboardingStep === 2) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-violet-600 font-medium mb-3">
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              Step 2 of 2
            </div>
            <h2 className="text-3xl font-bold text-slate-900">How much time can you read each day?</h2>
            <p className="text-slate-500 mt-1">Be honest — consistency beats intensity.</p>
          </div>

          <div className="space-y-3 mb-6">
            {PACE_OPTIONS.map((opt) => (
              <button
                key={opt.minutes}
                onClick={() => handlePaceSelect(opt.chaptersPerDay, opt.minutes)}
                className={`w-full text-left p-5 rounded-xl border-2 transition ${obMinutesPerDay === opt.minutes ? "border-violet-600 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 text-lg">{opt.label}</div>
                    <div className="text-sm text-slate-500">{opt.sub}</div>
                  </div>
                  {obMinutesPerDay === opt.minutes && (
                    <CheckCircle className="w-6 h-6 text-violet-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Start date */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
            <label className="text-sm font-medium text-slate-700 block mb-2">Start date</label>
            <input
              type="date"
              value={obStartDate}
              onChange={(e) => setObStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Finish date preview */}
          {obFinishDate && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 text-violet-700">
                <Target className="w-5 h-5" />
                <span className="font-semibold">You'll finish on {formatFinishDate(obFinishDate.d)}</span>
              </div>
              <p className="text-sm text-violet-600 mt-1">That's {obFinishDate.days} days from your start date.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setOnboardingStep(1)}
              className="px-6 py-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleStartPlan}
              className="flex-1 bg-violet-700 hover:bg-violet-800 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              Start My Plan <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard (has plan) ─────────────────────────────────────

  const firstName = user?.name?.split(" ")[0] ?? (user?.email?.split("@")[0] ?? "");
  const totalPlanChapters = plan
    ? getChaptersInPlan(plan.startBook, plan.startChapter, plan.endBook)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="text-slate-500 text-sm mt-1">{syncing ? "Syncing your progress…" : "Here's where you stand today."}</p>
        </div>

        {/* Today's Reading Card */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Today's Reading</div>
              <div className="text-2xl font-bold text-white leading-tight">{todayLabel || "—"}</div>
              {todayReading && (
                <div className="text-sm text-slate-400 mt-1">
                  Day {todayReading.dayNumber} of {todayReading.totalDays}
                </div>
              )}
            </div>
            {/* Streak badge */}
            <div className="flex-shrink-0 flex flex-col items-center bg-slate-800 rounded-xl px-4 py-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-xl font-bold text-white mt-0.5">{streak}</span>
              <span className="text-xs text-slate-400">day streak</span>
            </div>
          </div>

          <div className="mt-5">
            {todayDone ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 text-sm font-semibold px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4" /> Complete for today
                </div>
                {tomorrowReading && (
                  <a
                    href="/today"
                    className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 transition group"
                  >
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Read ahead — tomorrow</p>
                      <p className="text-sm font-semibold text-white">{tomorrowReading}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            ) : (
              <a
                href="/today"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition"
              >
                Start Reading <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Streak urgency — Duolingo-style "Don't lose your streak!" */}
        {streak > 0 && !todayDone && (
          <div className="bg-orange-500 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-orange-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-flame-pulse inline-block">🔥</span>
              <div>
                <p className="text-white font-bold text-sm">Don&apos;t lose your {streak}-day streak!</p>
                <p className="text-orange-100 text-xs">Read today to keep it alive.</p>
              </div>
            </div>
            <a
              href="/today"
              className="bg-white text-orange-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-orange-50 transition active:scale-95 flex-shrink-0"
            >
              Read Now
            </a>
          </div>
        )}

        {/* Streak celebration (already done today) */}
        {streak > 0 && todayDone && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
            <span className="text-lg animate-flame-pulse inline-block">🔥</span>
            <p className="text-sm font-medium text-orange-700">{getStreakMessage(streak)}</p>
          </div>
        )}

        {/* Status / Catch-up card */}
        {analysis && (() => {
          const { daysBehind, daysAhead, projectedFinishDate, scheduledFinishDate } = analysis;
          if (daysBehind >= 1 && daysBehind <= 3) {
            return (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-800">You're {daysBehind} day{daysBehind > 1 ? "s" : ""} behind</span>
                </div>
                <p className="text-sm text-amber-700 mb-4">No worries — life happens. Here's how to catch up:</p>
                <div className="space-y-2">
                  <a href="/today" className="flex items-center justify-between bg-white border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-50 transition">
                    <span className="text-sm font-medium text-slate-800">Read a bit more today</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
              </div>
            );
          }
          if (daysBehind > 3) {
            return (
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-slate-500" />
                  <span className="font-semibold text-slate-800">You've missed some days</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">Don't be hard on yourself. Every day you read is a win.</p>
                <p className="text-sm text-slate-500">At your current pace, you'll finish on <span className="font-medium text-slate-700">{formatFinishDate(projectedFinishDate)}</span>. Consider adjusting your daily chapters to set a more realistic pace.</p>
              </div>
            );
          }
          if (daysAhead >= 3) {
            const months = monthsDiff(projectedFinishDate, scheduledFinishDate);
            return (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">You're {daysAhead} days ahead of schedule!</span>
                </div>
                <p className="text-sm text-green-700">
                  At this pace, you'll finish on <span className="font-semibold">{formatFinishDate(projectedFinishDate)}</span>
                  {months > 0 ? ` — ${months} month${months > 1 ? "s" : ""} early` : ""}.
                </p>
              </div>
            );
          }
          // On track
          return (
            <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-700">You&apos;re right on track — keep it up!</p>
              </div>
              {!todayDone && (
                <a href="/today" className="text-xs font-bold text-green-700 bg-green-200 hover:bg-green-300 px-3 py-1.5 rounded-lg transition flex-shrink-0">
                  Read Now
                </a>
              )}
            </div>
          );
        })()}

        {/* Progress section — circular ring + XP level */}
        {plan && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-5">Your Progress</h2>

            {/* Ring + stats row */}
            <div className="flex items-center gap-6 mb-5">
              {/* Circular progress ring */}
              <div className="relative flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="url(#progress-ring-grad)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPct / 100)}`}
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                  />
                  <defs>
                    <linearGradient id="progress-ring-grad" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-slate-900">{progressPct}%</span>
                  <span className="text-xs text-slate-400">done</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Chapters read</p>
                  <p className="text-lg font-bold text-slate-900">{totalRead} <span className="text-sm font-normal text-slate-400">of {totalPlanChapters}</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Currently in</p>
                  <p className="text-sm font-semibold text-slate-800">{currentBookName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Finish by</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {analysis ? formatFinishDate(analysis.projectedFinishDate) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* XP / Level bar */}
            {levelInfo && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{levelInfo.emoji}</span>
                    <span className="font-bold text-slate-800">{levelInfo.title}</span>
                    <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">Lv.{levelInfo.level}</span>
                  </div>
                  <span className="text-xs text-slate-400">{levelInfo.currentXP} XP</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-700"
                    style={{ width: `${levelInfo.progressPct}%` }}
                  />
                </div>
                {!levelInfo.isMax && (
                  <p className="text-xs text-slate-400 mt-1">{levelInfo.nextXP - levelInfo.currentXP} XP to {levelInfo.level < 6 ? ["Student","Disciple","Scholar","Elder","Prophet"][levelInfo.level - 1] : "max"}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upcoming milestones */}
        {milestones.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Upcoming Milestones</h2>
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.book} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">{m.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">{m.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <a href="/today" className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3 hover:border-violet-200 transition shadow-sm">
            <BookOpen className="w-5 h-5 text-violet-600" />
            <span className="font-medium text-slate-800 text-sm">Today's Reading</span>
          </a>
          <a href="/profile" className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3 hover:border-violet-200 transition shadow-sm">
            <Calendar className="w-5 h-5 text-violet-600" />
            <span className="font-medium text-slate-800 text-sm">Calendar</span>
          </a>
        </div>

      </div>
    </div>
  );
}
