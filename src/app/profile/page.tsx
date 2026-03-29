"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Flame,
  BookOpen,
  Calendar,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  getGlobalChapterIndex,
  getBookAndChapter,
  chaptersRemaining,
  getMilestones,
} from "@/lib/bible-data";
import {
  getPlan,
  getCurrentStreak,
  getTotalChaptersRead,
  getMonthReadings,
  getProgress,
  formatDate,
} from "@/lib/reading-store";

export default function ProfilePage() {
  const [plan, setPlanState] = useState<ReturnType<typeof getPlan>>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [totalRead, setTotalRead] = useState(0);
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setPlanState(getPlan());
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setLoading(false);
  }, []);

  const monthReadings = useMemo(
    () => getMonthReadings(calYear, calMonth),
    [calYear, calMonth, totalRead] // recalc when progress changes
  );

  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();

  // Progress calculations
  const progressPercent = useMemo(() => {
    if (!plan) return 0;
    const total = chaptersRemaining(plan.startBook, plan.startChapter);
    return Math.min(100, Math.round((totalRead / total) * 100));
  }, [plan, totalRead]);

  // Current position in Bible
  const currentPosition = useMemo(() => {
    if (!plan) return null;
    const startGlobal = getGlobalChapterIndex(
      plan.startBook,
      plan.startChapter
    );
    const currentGlobal = Math.min(startGlobal + totalRead, TOTAL_CHAPTERS - 1);
    return getBookAndChapter(currentGlobal);
  }, [plan, totalRead]);

  // Milestones
  const milestones = useMemo(() => {
    if (!plan) return [];
    // Calculate based on remaining from current position
    const startGlobal = getGlobalChapterIndex(
      plan.startBook,
      plan.startChapter
    );
    const currentGlobal = startGlobal + totalRead;
    const currentBC = getBookAndChapter(
      Math.min(currentGlobal, TOTAL_CHAPTERS - 1)
    );
    return getMilestones(
      currentBC.book,
      currentBC.chapter,
      plan.chaptersPerDay
    );
  }, [plan, totalRead]);

  // Days active
  const daysActive = useMemo(() => {
    const progress = getProgress();
    return Object.keys(progress).filter((k) => progress[k].length > 0).length;
  }, [totalRead]);

  // Books completed
  const booksCompleted = useMemo(() => {
    if (!plan || totalRead === 0) return [];
    const startGlobal = getGlobalChapterIndex(
      plan.startBook,
      plan.startChapter
    );
    const endGlobal = startGlobal + totalRead;

    const completed: string[] = [];
    let running = 0;
    for (const book of BIBLE_BOOKS) {
      const bookEnd = running + book.chapters;
      if (running >= startGlobal && bookEnd <= endGlobal) {
        completed.push(book.name);
      }
      running += book.chapters;
    }
    return completed;
  }, [plan, totalRead]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const prevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
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
          <TrendingUp className="h-16 w-16 text-violet-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            No Progress Yet
          </h1>
          <p className="text-slate-500 mb-8">
            Create a reading plan to start tracking your progress.
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

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Your Journey</h1>
          <p className="text-slate-500 mt-1">
            Started{" "}
            {new Date(plan.startDate + "T00:00:00").toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            )}{" "}
            &middot; {plan.chaptersPerDay} chapters/day
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white rounded-xl p-4 text-center border border-violet-100">
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{streak}</p>
            <p className="text-xs text-slate-500">Day Streak</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-violet-100">
            <BookOpen className="h-5 w-5 text-violet-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{totalRead}</p>
            <p className="text-xs text-slate-500">Chapters Read</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-violet-100">
            <Calendar className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{daysActive}</p>
            <p className="text-xs text-slate-500">Days Active</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-violet-100">
            <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">
              {progressPercent}%
            </p>
            <p className="text-xs text-slate-500">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-6 border border-violet-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Overall Progress</h3>
            {currentPosition && (
              <span className="text-sm text-violet-600 font-medium">
                Currently in {currentPosition.book} {currentPosition.chapter}
              </span>
            )}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 mb-2">
            <div
              className="bg-gradient-to-r from-violet-500 to-violet-600 h-4 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{plan.startBook}</span>
            <span>Revelation</span>
          </div>
        </div>

        {/* Bible Book Map */}
        <div className="bg-white rounded-xl p-6 border border-violet-100 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">Bible Map</h3>
          <div className="flex flex-wrap gap-1">
            {BIBLE_BOOKS.map((book) => {
              const bookStart = getGlobalChapterIndex(book.name, 1);
              const bookEnd = bookStart + book.chapters;
              const planStart = getGlobalChapterIndex(
                plan.startBook,
                plan.startChapter
              );
              const readEnd = planStart + totalRead;

              let status: "completed" | "current" | "upcoming" | "before";
              if (bookEnd <= planStart) {
                status = "before";
              } else if (bookEnd <= readEnd) {
                status = "completed";
              } else if (bookStart < readEnd) {
                status = "current";
              } else {
                status = "upcoming";
              }

              return (
                <div
                  key={book.name}
                  title={`${book.name} (${book.chapters} ch)`}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    status === "completed"
                      ? "bg-violet-600 text-white"
                      : status === "current"
                      ? "bg-violet-200 text-violet-800 ring-2 ring-violet-400"
                      : status === "before"
                      ? "bg-slate-200 text-slate-500"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {book.abbreviation}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-violet-600" /> Read
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-violet-200 ring-1 ring-violet-400" />{" "}
              Current
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-slate-100" /> Upcoming
            </span>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl p-6 border border-violet-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-slate-100 rounded transition"
            >
              <ChevronLeft className="h-5 w-5 text-slate-500" />
            </button>
            <h3 className="font-semibold text-slate-900">
              {monthNames[calMonth - 1]} {calYear}
            </h3>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-slate-100 rounded transition"
            >
              <ChevronRight className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-slate-400 font-medium py-1">
                {d}
              </div>
            ))}
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isRead = monthReadings.has(day);
              const isToday =
                calYear === new Date().getFullYear() &&
                calMonth === new Date().getMonth() + 1 &&
                day === new Date().getDate();

              return (
                <div
                  key={day}
                  className={`py-1.5 rounded-md text-xs font-medium ${
                    isRead
                      ? "bg-violet-600 text-white"
                      : isToday
                      ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 mt-3 text-center">
            {monthReadings.size} of {daysInMonth} days completed
          </p>
        </div>

        {/* Upcoming Milestones */}
        {milestones.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-violet-100 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-500" /> Upcoming
              Milestones
            </h3>
            <div className="space-y-3">
              {milestones.slice(0, 5).map((m) => (
                <div
                  key={m.book}
                  className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                >
                  <span className="text-sm text-slate-700 font-medium">
                    {m.label}
                  </span>
                  <span className="text-sm text-slate-500">
                    {m.date.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Books Completed */}
        {booksCompleted.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-violet-100 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Books Completed ({booksCompleted.length} of 66)
            </h3>
            <div className="flex flex-wrap gap-2">
              {booksCompleted.map((b) => (
                <span
                  key={b}
                  className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <a
            href="/today"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-700 text-white rounded-lg hover:bg-violet-800 transition font-semibold"
          >
            <BookOpen className="h-4 w-4" /> Today&apos;s Reading
          </a>
          <a
            href="/plans"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-violet-200 text-slate-700 rounded-lg hover:bg-violet-50 transition font-medium"
          >
            <RotateCcw className="h-4 w-4" /> New Plan
          </a>
        </div>
      </div>
    </div>
  );
}
