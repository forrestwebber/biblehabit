"use client";
import { useState, useMemo } from "react";
import { ArrowRight, Calendar, BookOpen, Clock, CheckCircle } from "lucide-react";
import NavBar from "@/components/NavBar";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  calculatePlan,
  getMilestones,
  chaptersRemaining,
} from "@/lib/bible-data";
import { savePlan } from "@/lib/reading-store";

const TRANSLATIONS = ["KJV", "NIV", "ESV", "NKJV", "NASB"];

const PACE_OPTIONS = [
  { label: "1 chapter", perDay: 1, time: "~5 min" },
  { label: "2–3 chapters", perDay: 3, time: "~15 min" },
  { label: "4–5 chapters", perDay: 4, time: "~20 min" },
  { label: "6+ chapters", perDay: 7, time: "~30 min" },
];

const TIME_OPTIONS = [
  { label: "15 min/day", minutes: 15, perDay: 3 },
  { label: "30 min/day", minutes: 30, perDay: 6 },
  { label: "45 min/day", minutes: 45, perDay: 9 },
  { label: "60 min/day", minutes: 60, perDay: 12 },
];

const DURATION_OPTIONS = [
  { label: "2 months", days: 56, weeks: 8 },
  { label: "3 months", days: 84, weeks: 12 },
  { label: "6 months", days: 182, weeks: 26 },
  { label: "12 months", days: 365, weeks: 52 },
];

export default function PlansPage() {
  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedTranslation, setSelectedTranslation] = useState("KJV");
  const [mode, setMode] = useState<"pace" | "time" | "duration">("pace");
  const [selectedPace, setSelectedPace] = useState(3);
  const [selectedTime, setSelectedTime] = useState(30);
  const [selectedDuration, setSelectedDuration] = useState(365);
  const [planSaved, setPlanSaved] = useState(false);

  const bookObj = BIBLE_BOOKS.find((b) => b.name === selectedBook);
  const maxChapter = bookObj?.chapters ?? 1;

  // Calculate chapters per day based on mode
  const chaptersPerDay = useMemo(() => {
    if (mode === "pace") return selectedPace;
    if (mode === "time") {
      const timeOpt = TIME_OPTIONS.find((t) => t.minutes === selectedTime);
      return timeOpt?.perDay ?? 3;
    }
    const remaining = chaptersRemaining(selectedBook, selectedChapter);
    return Math.max(1, Math.ceil(remaining / selectedDuration));
  }, [mode, selectedPace, selectedTime, selectedDuration, selectedBook, selectedChapter]);

  const plan = useMemo(
    () => calculatePlan(selectedBook, selectedChapter, chaptersPerDay),
    [selectedBook, selectedChapter, chaptersPerDay]
  );

  const milestones = useMemo(
    () => getMilestones(selectedBook, selectedChapter, chaptersPerDay),
    [selectedBook, selectedChapter, chaptersPerDay]
  );

  const progressPercent = useMemo(() => {
    const done =
      TOTAL_CHAPTERS - chaptersRemaining(selectedBook, selectedChapter);
    return Math.round((done / TOTAL_CHAPTERS) * 100);
  }, [selectedBook, selectedChapter]);

  const handleStartPlan = () => {
    savePlan({
      startBook: selectedBook,
      startChapter: selectedChapter,
      chaptersPerDay,
      startDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    });
    setPlanSaved(true);
    setTimeout(() => {
      window.location.href = "/today";
    }, 800);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

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
          Pick where you are, choose your pace, and see exactly when you&apos;ll
          finish the Bible.
        </p>
      </section>

      {/* Calculator */}
      <section className="pb-16 px-6 max-w-4xl mx-auto">
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
                  onChange={(e) => setSelectedTranslation(e.target.value)}
                  className="w-full px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  {TRANSLATIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Where are you starting?
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedBook}
                    onChange={(e) => {
                      setSelectedBook(e.target.value);
                      setSelectedChapter(1);
                    }}
                    className="flex-1 px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  >
                    {BIBLE_BOOKS.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(Number(e.target.value))}
                    className="w-24 px-4 py-3 border border-violet-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  >
                    {Array.from({ length: maxChapter }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Ch. {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mode toggle */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Choose by...
                </label>
                <div className="flex gap-2">
                  {(["pace", "time", "duration"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                        mode === m
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {m === "pace" ? "Chapters" : m === "time" ? "Minutes" : "Duration"}
                    </button>
                  ))}
                </div>
              </div>

              {mode === "time" ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Daily reading time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
                        <p className={`text-xs ${selectedTime === t.minutes ? "text-violet-500" : "text-slate-500"}`}>
                          ~{t.perDay} chapters
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : mode === "pace" ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    How much per day?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PACE_OPTIONS.map((p) => (
                      <button
                        key={p.perDay}
                        onClick={() => setSelectedPace(p.perDay)}
                        className={`py-3 px-2 border-2 rounded-lg text-center transition text-sm ${
                          selectedPace === p.perDay
                            ? "border-violet-500 bg-violet-50"
                            : "border-violet-200 hover:border-violet-300"
                        }`}
                      >
                        <p
                          className={`font-bold ${
                            selectedPace === p.perDay
                              ? "text-violet-700"
                              : "text-slate-900"
                          }`}
                        >
                          {p.label}
                        </p>
                        <p
                          className={`text-xs ${
                            selectedPace === p.perDay
                              ? "text-violet-500"
                              : "text-slate-500"
                          }`}
                        >
                          {p.time}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Finish in...
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d.days}
                        onClick={() => setSelectedDuration(d.days)}
                        className={`py-3 px-2 border-2 rounded-lg text-center transition text-sm ${
                          selectedDuration === d.days
                            ? "border-violet-500 bg-violet-50"
                            : "border-violet-200 hover:border-violet-300"
                        }`}
                      >
                        <p
                          className={`font-bold ${
                            selectedDuration === d.days
                              ? "text-violet-700"
                              : "text-slate-900"
                          }`}
                        >
                          {d.label}
                        </p>
                        <p
                          className={`text-xs ${
                            selectedDuration === d.days
                              ? "text-violet-500"
                              : "text-slate-500"
                          }`}
                        >
                          {d.weeks} weeks · ~{Math.ceil(
                            chaptersRemaining(selectedBook, selectedChapter) /
                              d.days
                          )}{" "}
                          ch/day
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div className="p-8 bg-violet-50/50">
              <h3 className="font-bold text-violet-700 text-sm uppercase tracking-wide mb-6 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Your Plan Preview
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Translation</span>
                  <span className="font-semibold text-slate-900">
                    {selectedTranslation}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Starting from</span>
                  <span className="font-semibold text-slate-900">
                    {selectedBook} {selectedChapter}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Already read</span>
                  <span className="font-semibold text-slate-900">
                    {progressPercent}% of the Bible
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">
                    Chapters remaining
                  </span>
                  <span className="font-semibold text-slate-900">
                    {plan.totalChapters}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">
                    Chapters per day
                  </span>
                  <span className="font-semibold text-slate-900">
                    ~{chaptersPerDay}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Reading time</span>
                  <span className="font-semibold text-slate-900">
                    ~{Math.max(5, chaptersPerDay * 5)} min/day
                  </span>
                </div>

                <hr className="border-violet-200" />

                {/* Milestones */}
                {milestones.slice(0, 3).map((m) => (
                  <div
                    key={m.book}
                    className="flex justify-between items-center"
                  >
                    <span className="text-slate-500 text-sm">
                      By {formatDate(m.date)}
                    </span>
                    <span className="font-medium text-slate-700">
                      {m.label}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between items-center bg-white -mx-2 px-3 py-2 rounded-lg">
                  <span className="text-violet-600 text-sm font-semibold">
                    Finish by
                  </span>
                  <span className="font-bold text-violet-700">
                    {formatDate(plan.finishDate)} &#10003;
                  </span>
                </div>
              </div>

              {/* First week preview */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Your first week
                </h4>
                <div className="space-y-1.5">
                  {plan.dailyReadings.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg"
                    >
                      <span className="text-violet-400 font-mono text-xs w-12">
                        Day {i + 1}
                      </span>
                      <span className="text-slate-700">
                        {r.book} {r.chapters}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

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
                    <CheckCircle className="h-4 w-4" /> Plan Saved!
                    Redirecting...
                  </>
                ) : (
                  <>
                    Start This Plan <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Amazon Affiliate Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Get Your Own Copy
          </h2>
          <p className="text-slate-500 mb-8">
            Hold Scripture in your hands. Our recommended editions.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "KJV Large Print",
                desc: "Classic translation, easy on the eyes.",
                price: "$14.99",
                asin: "0785215611",
              },
              {
                title: "ESV Study Bible",
                desc: "The gold standard for study. Notes, maps, articles.",
                price: "$29.99",
                asin: "1433502410",
              },
              {
                title: "NIV Life Application",
                desc: "Practical notes for daily living.",
                price: "$24.99",
                asin: "1496439694",
              },
            ].map((book) => (
              <div
                key={book.title}
                className="bg-violet-50 rounded-xl p-6 hover:shadow-md transition"
              >
                <h3 className="font-bold text-slate-900 mb-1">{book.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{book.desc}</p>
                <p className="text-violet-600 font-bold mb-3">{book.price}</p>
                <a
                  href={`https://www.amazon.com/dp/${book.asin}?tag=wandereadvisor-20`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800 font-semibold"
                >
                  View on Amazon <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-violet-100 py-8 px-6 text-center text-slate-400 text-sm">
        <p>
          &copy; {new Date().getFullYear()} BibleHabit, a division of HD Signals
          LLC. Scripture changes everything.
        </p>
      </footer>
    </div>
  );
}
