"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ArrowRight,
  Calendar,
  BookOpen,
  Clock,
  CheckCircle,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  AlertTriangle,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import BibleAffiliate from "@/components/BibleAffiliate";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  calculatePlan,
  calculateRange,
  getMilestones,
  chaptersRemaining,
  generateFullPlan,
  getBookColor,
  type FullDayReading,
} from "@/lib/bible-data";
import { savePlan } from "@/lib/reading-store";
import {
  addSubPlan,
  getSubPlans,
  removeSubPlan,
  DEVOTIONAL_PRESETS,
} from "@/lib/sub-plans";

const TRANSLATIONS = [
  { id: "kjv", label: "KJV — King James" },
  { id: "web", label: "WEB — World English (modern)" },
  { id: "asv", label: "ASV — American Standard" },
  { id: "bbe", label: "BBE — Basic English" },
];

const TIME_OPTIONS = [
  { label: "15 min/day", minutes: 15 },
  { label: "30 min/day", minutes: 30 },
  { label: "60 min/day", minutes: 60 },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateNice(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Generate iCal content
function generateICS(readings: FullDayReading[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BibleHabit//Reading Plan//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:BibleHabit Reading Plan",
  ];

  for (const reading of readings) {
    const dateStr = reading.dateStr.replace(/-/g, "");
    const nextDay = new Date(reading.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const endStr = formatDateISO(nextDay).replace(/-/g, "");

    lines.push("BEGIN:VEVENT");
    lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
    lines.push(`DTEND;VALUE=DATE:${endStr}`);
    lines.push(`SUMMARY:Read ${reading.summary}`);
    lines.push(`DESCRIPTION:Day ${reading.day} - ${reading.summary}`);
    lines.push(`UID:biblehabit-day${reading.day}@biblehabit.co`);
    lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// Generate plain text plan
function generateTextPlan(readings: FullDayReading[]): string {
  const lines = [
    "BibleHabit — Your Reading Plan",
    "================================",
    "",
    `Total: ${readings.length} days | ${readings[0]?.summary || ""} to ${readings[readings.length - 1]?.summary || ""}`,
    "",
  ];

  let currentWeek = -1;
  for (const r of readings) {
    const week = Math.ceil(r.day / 7);
    if (week !== currentWeek) {
      currentWeek = week;
      lines.push(`--- Week ${week} ---`);
    }
    const dayName = DAY_NAMES[r.date.getDay()];
    const dateLabel = r.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    lines.push(`  ${dayName} ${dateLabel}: ${r.summary}`);
  }

  lines.push("");
  lines.push("Generated at biblehabit.co/plans");
  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function PlansPage() {
  const [startBook, setStartBook] = useState("Genesis");
  const [endBook, setEndBook] = useState("Revelation");
  const [selectedTranslation, setSelectedTranslation] = useState("kjv");
  const [selectedTime, setSelectedTime] = useState(30);
  const [planSaved, setPlanSaved] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [copied, setCopied] = useState(false);
  const [startDate, setStartDate] = useState(formatDateISO(new Date()));
  const [activeSubPlans, setActiveSubPlans] = useState<string[]>([]);
  const [addedPreset, setAddedPreset] = useState<string | null>(null);

  // Load active sub-plans on mount
  useEffect(() => {
    setActiveSubPlans(getSubPlans().filter(p => !p.paused).map(p => p.book));
  }, []);

  const parsedStartDate = useMemo(() => {
    const [y, m, d] = startDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [startDate]);

  // Range calculator result
  const rangeResult = useMemo(
    () => calculateRange(startBook, endBook, selectedTime, parsedStartDate),
    [startBook, endBook, selectedTime, parsedStartDate]
  );

  const hasError = !!rangeResult.error;

  // For the "Start This Plan" feature, map to the existing plan system
  const chaptersPerDay = rangeResult.chaptersPerDay;

  const plan = useMemo(
    () => hasError ? null : calculatePlan(startBook, 1, chaptersPerDay, parsedStartDate),
    [startBook, chaptersPerDay, parsedStartDate, hasError]
  );

  const fullPlan = useMemo(
    () => hasError ? [] : generateFullPlan(startBook, 1, chaptersPerDay, parsedStartDate),
    [startBook, chaptersPerDay, parsedStartDate, hasError]
  );

  const milestones = useMemo(
    () => hasError ? [] : getMilestones(startBook, 1, chaptersPerDay, parsedStartDate),
    [startBook, chaptersPerDay, parsedStartDate, hasError]
  );

  // Index full plan by dateStr for calendar lookup
  const planByDate = useMemo(() => {
    const map: Record<string, FullDayReading> = {};
    for (const r of fullPlan) {
      map[r.dateStr] = r;
    }
    return map;
  }, [fullPlan]);

  // Calendar month data
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (FullDayReading | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push(planByDate[dateStr] || null);
    }
    return { days, totalDays, startPad, year, month };
  }, [calendarMonth, planByDate]);

  const handleStartPlan = () => {
    if (hasError) return;
    savePlan({
      startBook,
      startChapter: 1,
      chaptersPerDay,
      startDate: startDate,
      createdAt: new Date().toISOString(),
    });
    setPlanSaved(true);
    setTimeout(() => {
      window.location.href = "/today";
    }, 800);
  };

  const handleDownloadICS = useCallback(() => {
    const ics = generateICS(fullPlan);
    downloadFile(ics, "biblehabit-reading-plan.ics", "text/calendar");
  }, [fullPlan]);

  const handleCopyText = useCallback(() => {
    const text = generateTextPlan(fullPlan);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [fullPlan]);

  const handleDownloadText = useCallback(() => {
    const text = generateTextPlan(fullPlan);
    downloadFile(text, "biblehabit-reading-plan.txt", "text/plain");
  }, [fullPlan]);

  const prevMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() - 1);
    setCalendarMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() + 1);
    setCalendarMonth(d);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <NavBar />

      {/* Hero */}
      <section className="text-center py-12 px-6 max-w-3xl mx-auto">
        <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-3 py-1 rounded-full">
          100% Free Forever
        </span>
        <h1 className="text-4xl font-bold text-slate-900 mt-6 mb-4">
          Build Your Reading Plan
        </h1>
        <p className="text-lg text-slate-500">
          Know exactly how long before you start reading. Pick your range, choose your pace, and see your finish date.
        </p>
      </section>

      {/* Calculator */}
      <section className="pb-8 px-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-violet-100">
            {/* Left: Inputs */}
            <div className="p-8 space-y-6">
              {/* Translation selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Preferred Translation
                </label>
                <select
                  value={selectedTranslation}
                  onChange={(e) => {
                    setSelectedTranslation(e.target.value);
                    // Save so /today picks it up
                    if (typeof window !== "undefined") {
                      localStorage.setItem("biblehabit_translation", e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  {TRANSLATIONS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">All 4 translations are free &amp; copyright-free. NIV/ESV coming soon.</p>
              </div>

              {/* Starting Book */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <BookOpen className="inline h-4 w-4 mr-1 text-violet-500" />
                  Starting Book
                </label>
                <select
                  value={startBook}
                  onChange={(e) => setStartBook(e.target.value)}
                  className="w-full px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  {BIBLE_BOOKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.chapters} ch.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Ending Book */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <BookOpen className="inline h-4 w-4 mr-1 text-violet-500" />
                  Ending Book
                </label>
                <select
                  value={endBook}
                  onChange={(e) => setEndBook(e.target.value)}
                  className="w-full px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  {BIBLE_BOOKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.chapters} ch.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Reading Time */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1 text-violet-500" />
                  Daily Reading Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t.minutes}
                      onClick={() => setSelectedTime(t.minutes)}
                      className={`py-3 px-2 border-2 rounded-lg text-center transition text-sm ${
                        selectedTime === t.minutes
                          ? "border-violet-500 bg-violet-50"
                          : "border-violet-200 hover:border-violet-300"
                      }`}
                    >
                      <p className={`font-bold ${selectedTime === t.minutes ? "text-violet-700" : "text-slate-900"}`}>
                        {t.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    const [y, m] = e.target.value.split("-").map(Number);
                    setCalendarMonth(new Date(y, m - 1, 1));
                  }}
                  className="w-full px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Preview */}
            <div className="p-8 bg-violet-50/50">
              <h3 className="font-bold text-violet-700 text-sm uppercase tracking-wide mb-6 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Your Plan Preview
              </h3>

              {/* Error State */}
              {hasError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                  <p className="text-red-700 font-semibold text-lg mb-1">Invalid Range</p>
                  <p className="text-red-600 text-sm">{rangeResult.error}</p>
                </div>
              ) : (
                <>
                  {/* Summary one-liner */}
                  <div className="bg-violet-100 rounded-xl p-5 mb-6 text-center">
                    <p className="text-violet-900 font-bold text-lg leading-snug">
                      Read {rangeResult.totalChapters} chapters in {rangeResult.totalDays} days, finishing{" "}
                      {formatDateNice(rangeResult.endDate)}
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Translation</span>
                      <span className="font-semibold text-slate-900">{TRANSLATIONS.find(t => t.id === selectedTranslation)?.label.split(" — ")[0] ?? selectedTranslation.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Range</span>
                      <span className="font-semibold text-slate-900">{startBook} → {endBook}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Start date</span>
                      <span className="font-semibold text-slate-900">
                        {parsedStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Total chapters</span>
                      <span className="font-semibold text-slate-900">{rangeResult.totalChapters}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Chapters per day</span>
                      <span className="font-semibold text-slate-900">~{rangeResult.chaptersPerDay}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Reading time</span>
                      <span className="font-semibold text-slate-900">{selectedTime} min/day</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Total days</span>
                      <span className="font-semibold text-slate-900">{rangeResult.totalDays}</span>
                    </div>

                    <hr className="border-violet-200" />

                    {milestones.slice(0, 3).map((m) => (
                      <div key={m.book} className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">By {m.date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                        <span className="font-medium text-slate-700">{m.label}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center bg-white -mx-2 px-3 py-2 rounded-lg">
                      <span className="text-violet-600 text-sm font-semibold">Finish by</span>
                      <span className="font-bold text-violet-700">
                        {formatDateNice(rangeResult.endDate)} &#10003;
                      </span>
                    </div>
                  </div>

                  {/* First week preview */}
                  {plan && (
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Your first week
                      </h4>
                      <div className="space-y-1.5">
                        {plan.dailyReadings.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg">
                            <span className="text-violet-400 font-mono text-xs w-12">Day {i + 1}</span>
                            <span className="text-slate-700">{r.book} {r.chapters}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleStartPlan}
                    disabled={planSaved}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition ${
                      planSaved
                        ? "bg-green-600 text-white"
                        : "bg-violet-700 text-white hover:bg-violet-800"
                    }`}
                  >
                    {planSaved ? (
                      <>
                        <CheckCircle className="h-4 w-4" /> Plan Saved! Redirecting...
                      </>
                    ) : (
                      <>
                        Start This Plan <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Export Options — only show when no error */}
      {!hasError && (
        <section className="pb-8 px-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-violet-600" /> Export Your Plan
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                onClick={handleDownloadICS}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl font-semibold transition border border-violet-200"
              >
                <CalendarDays className="h-4 w-4" />
                Download .ics
              </button>
              <button
                onClick={handleDownloadText}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl font-semibold transition border border-violet-200"
              >
                <FileText className="h-4 w-4" />
                Download .txt
              </button>
              <button
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl font-semibold transition border border-violet-200"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy as Text
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              .ics works with Google Calendar, Apple Calendar, and Outlook
            </p>
          </div>
        </section>
      )}

      {/* Calendar Toggle — only show when no error */}
      {!hasError && (
        <section className="pb-4 px-6 max-w-4xl mx-auto text-center">
          <button
            onClick={() => {
              setShowCalendar(!showCalendar);
              if (!showCalendar) {
                setCalendarMonth(parsedStartDate);
              }
            }}
            className="inline-flex items-center gap-2 py-2.5 px-6 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition"
          >
            <Calendar className="h-4 w-4" />
            {showCalendar ? "Hide Calendar View" : "View Full Calendar"}
          </button>
        </section>
      )}

      {/* Calendar View */}
      {showCalendar && !hasError && (
        <section className="pb-16 px-6 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <h3 className="text-xl font-bold text-slate-900">
                {formatMonthYear(calendarMonth)}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.days.map((reading, idx) => {
                const dayNum = idx - calendarDays.startPad + 1;
                const isInMonth = dayNum >= 1 && dayNum <= calendarDays.totalDays;

                if (!isInMonth) {
                  return <div key={idx} className="aspect-square" />;
                }

                const hasReading = reading !== null;

                return (
                  <div
                    key={idx}
                    className={`aspect-square p-1 rounded-lg border transition ${
                      hasReading
                        ? "border-violet-100 hover:border-violet-300 hover:shadow-sm"
                        : "border-transparent"
                    }`}
                  >
                    <div className="h-full flex flex-col">
                      <span className={`text-xs font-medium ${hasReading ? "text-slate-900" : "text-slate-300"}`}>
                        {dayNum}
                      </span>
                      {hasReading && (
                        <div className="flex-1 flex items-center justify-center min-h-0">
                          <div
                            className="w-full text-center rounded px-0.5 py-0.5"
                            style={{
                              backgroundColor: `${getBookColor(reading.book)}15`,
                              borderLeft: `2px solid ${getBookColor(reading.book)}`,
                            }}
                          >
                            <p
                              className="text-[10px] sm:text-xs font-semibold leading-tight truncate"
                              style={{ color: getBookColor(reading.book) }}
                              title={reading.summary}
                            >
                              {reading.summary.length > 14
                                ? reading.summary.slice(0, 12) + "…"
                                : reading.summary}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-violet-100">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Book Groups
              </h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Pentateuch", color: "#7c6dff" },
                  { label: "History", color: "#00b4d8" },
                  { label: "Poetry", color: "#f59e0b" },
                  { label: "Major Prophets", color: "#ef4444" },
                  { label: "Minor Prophets", color: "#f97316" },
                  { label: "Gospels", color: "#10b981" },
                  { label: "Acts", color: "#06b6d4" },
                  { label: "Epistles", color: "#8b5cf6" },
                  { label: "General/Rev", color: "#ec4899" },
                ].map((g) => (
                  <div key={g.label} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="text-xs text-slate-500">{g.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Daily Devotionals Section */}
      <section id="devotionals" className="bg-violet-50 border-t border-violet-100 px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Add Daily Devotionals</h2>
          <p className="text-sm text-slate-500 mb-6">
            Stack short daily readings alongside your main plan. Each takes ~5 minutes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEVOTIONAL_PRESETS.map((preset) => {
              const isActive = activeSubPlans.includes(preset.book);
              const justAdded = addedPreset === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 transition ${
                    isActive ? "border-violet-300" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{preset.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{preset.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{preset.desc}</p>
                    </div>
                  </div>
                  {isActive ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-violet-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Active
                      </span>
                      <button
                        onClick={() => {
                          const plans = getSubPlans();
                          const match = plans.find(p => p.book === preset.book);
                          if (match) {
                            removeSubPlan(match.id);
                            setActiveSubPlans(prev => prev.filter(b => b !== preset.book));
                          }
                        }}
                        className="text-xs text-slate-400 hover:text-red-500 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        addSubPlan({
                          label: preset.label,
                          book: preset.book,
                          totalChapters: preset.totalChapters,
                          chaptersPerDay: preset.chaptersPerDay,
                          startDate: formatDateISO(new Date()),
                        });
                        setActiveSubPlans(prev => [...prev, preset.book]);
                        setAddedPreset(preset.id);
                        setTimeout(() => setAddedPreset(null), 2000);
                      }}
                      className="w-full bg-violet-700 text-white text-sm font-semibold py-2 rounded-xl hover:bg-violet-800 active:scale-95 transition-all"
                    >
                      {justAdded ? "Added! ✓" : `Add ${preset.label}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {activeSubPlans.length > 0 && (
            <p className="text-center text-xs text-slate-400 mt-5">
              Your devotionals appear on the <a href="/today" className="text-violet-600 underline">Today</a> page alongside your main reading.
            </p>
          )}
        </div>
      </section>

      {/* Amazon Affiliate Section */}
      <BibleAffiliate
        count={6}
        heading="Get Your Own Copy"
        subheading="Starting a new reading plan? A physical Bible makes it stick."
        variant="white"
      />

      <footer className="bg-white border-t border-violet-100 py-8 px-6 text-center text-slate-400 text-sm">
        <p>
          &copy; {new Date().getFullYear()} BibleHabit, a division of HD Signals
          LLC. Scripture changes everything.
        </p>
      </footer>
    </div>
  );
}
