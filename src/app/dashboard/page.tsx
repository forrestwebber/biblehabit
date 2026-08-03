"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import NavBar from "@/components/NavBar";
import TrialWall from "@/components/TrialWall";
import TrialBanner from "@/components/TrialBanner";
import { useEntitlement } from "@/lib/use-entitlement";
import { authHeaders } from "@/lib/use-entitlement";
import { supabase } from "@/lib/supabase";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  getGlobalChapterIndex,
  getBookAndChapter,
  getChaptersInPlan,
  getPlanEndGlobal,
  getTodaysReading,
} from "@/lib/bible-data";
import {
  getPlan, savePlan, getCurrentStreak, getTotalChaptersRead,
  isDayComplete, formatDate, syncProgress, getProgressAnalysis,
  getWeeklyChapterCounts,
  type SavedPlan, type ProgressAnalysis,
} from "@/lib/reading-store";
import {
  getSubPlans, getSubPlanChapterToday, markSubPlanDone, isSubPlanDoneToday,
  getSubPlanStreak, addSubPlan, type SubPlan,
} from "@/lib/sub-plans";
import { getReminderTime, setReminderTime, setReminderEnabled, REMINDER_TIMES } from "@/lib/prefs";
import { estimateChapterMinutes, estimateDailyMinutes } from "@/lib/reading-time";

type User = { id: string; email?: string; name?: string };

function formatFinishDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const SunriseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" />
    <path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 6 4-4 4 4" />
    <path d="M16 18a4 4 0 0 0-8 0" />
  </svg>
);

const CheckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);

// ─── Onboarding data ─────────────────────────────────────────────

type ReadingStage = "fresh" | "partway" | "while";
type PlanChoice = "year" | "nt90" | "psalm";

const STAGE_CARDS: { id: ReadingStage; title: string; desc: string }[] = [
  { id: "fresh", title: "Starting fresh", desc: "Genesis 1, or wherever you'd like to begin." },
  { id: "partway", title: "Already partway through", desc: "Tell us the last chapter you finished." },
  { id: "while", title: "Been reading a while", desc: "We'll pick up mid-stream, right where you are." },
];

// Estimated minutes/day per card — same words-per-minute model the Today screen uses.
const PLAN_MINUTES: Record<PlanChoice, number> = {
  year: Math.round(4 * estimateChapterMinutes("Genesis")),
  nt90: Math.round(3 * estimateChapterMinutes("Matthew")),
  psalm: Math.round(
    estimateChapterMinutes("Matthew") + estimateChapterMinutes("Psalms") + estimateChapterMinutes("Proverbs")
  ),
};

const PLAN_CARDS: { id: PlanChoice; title: string; desc: string }[] = [
  { id: "year", title: "Whole Bible in a year", desc: `Four chapters · about ${PLAN_MINUTES.year} minutes a day` },
  { id: "nt90", title: "New Testament in 90 days", desc: `Three chapters · about ${PLAN_MINUTES.nt90} minutes a day` },
  { id: "psalm", title: "A Psalm, a Proverb, and a bit of the New Testament", desc: `Three short readings · about ${PLAN_MINUTES.psalm} minutes a day` },
];

function BookPicker({ selected, onSelect }: { selected: string; onSelect: (book: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {BIBLE_BOOKS.map((b) => (
        <button
          key={b.name}
          onClick={() => onSelect(b.name)}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            background: selected === b.name ? "var(--gold-500)" : "var(--surface-sunk)",
            color: selected === b.name ? "var(--text-on-accent)" : "var(--text-secondary)",
            transition: "background 200ms, color 200ms",
          }}
        >
          {b.name}
        </button>
      ))}
    </div>
  );
}

function ChapterPicker({ book, selected, onSelect }: { book: string; selected: number; onSelect: (ch: number) => void }) {
  const bookData = BIBLE_BOOKS.find((b) => b.name === book);
  const total = bookData?.chapters ?? 1;
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((ch) => (
        <button
          key={ch}
          onClick={() => onSelect(ch)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            background: selected === ch ? "var(--gold-500)" : "var(--surface-sunk)",
            color: selected === ch ? "var(--text-on-accent)" : "var(--text-secondary)",
          }}
        >
          {ch}
        </button>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function PlanPage() {
  // Plan creation, plan changes, the pacing engine, recalculate and the habit
  // checklist are the product. All of it is behind the 7-day trial.
  const {
    ent,
    locked,
    isNative,
    refresh: refreshEntitlement,
    loading: entLoading,
  } = useEntitlement();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [obStep, setObStep] = useState(0);

  // Stats
  const [streak, setStreak] = useState(0);
  const [totalRead, setTotalRead] = useState(0);
  const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);
  const [planMode, setPlanMode] = useState<"goal" | "habit">("goal");
  const [recalculated, setRecalculated] = useState(false);

  // Habit checklist
  const [subPlans, setSubPlans] = useState<SubPlan[]>([]);
  const [subPlanDone, setSubPlanDone] = useState<Set<string>>(new Set());
  const [mainDoneToday, setMainDoneToday] = useState(false);

  // Onboarding state
  const [obStage, setObStage] = useState<ReadingStage>("while");
  const [obBook, setObBook] = useState("Genesis");
  const [obChapter, setObChapter] = useState(1);
  const [obPlan, setObPlan] = useState<PlanChoice>("year");
  const [obTime, setObTime] = useState("7:00");

  const refreshSubPlans = useCallback(() => {
    const plans = getSubPlans().filter((p) => !p.paused);
    setSubPlans(plans);
    const doneSet = new Set<string>();
    for (const p of plans) if (isSubPlanDoneToday(p.id)) doneSet.add(p.id);
    setSubPlanDone(doneSet);
  }, []);

  useEffect(() => {
    setObTime(getReminderTime());
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
      });

      const savedPlan = getPlan();
      if (!savedPlan) {
        setOnboarding(true);
      } else {
        setPlan(savedPlan);
        setStreak(getCurrentStreak());
        setTotalRead(getTotalChaptersRead());
        setAnalysis(getProgressAnalysis(savedPlan));
        setMainDoneToday(isDayComplete(formatDate(new Date())));
      }
      refreshSubPlans();
      setLoading(false);

      await syncProgress();
      const refreshedPlan = getPlan();
      if (refreshedPlan) {
        setPlan(refreshedPlan);
        setOnboarding(false);
        setStreak(getCurrentStreak());
        setTotalRead(getTotalChaptersRead());
        setAnalysis(getProgressAnalysis(refreshedPlan));
        setMainDoneToday(isDayComplete(formatDate(new Date())));
      }
    });
  }, [refreshSubPlans]);

  // ─── Derived plan facts ──────────────────────────────────────
  const totalPlanChapters = plan
    ? getChaptersInPlan(plan.startBook, plan.startChapter, plan.endBook)
    : 0;

  const actualPct = totalPlanChapters > 0 ? Math.min(100, (totalRead / totalPlanChapters) * 100) : 0;
  const expectedPct = analysis && totalPlanChapters > 0
    ? Math.min(100, (analysis.expectedChapters / totalPlanChapters) * 100)
    : 0;

  const weeklyCounts = useMemo(() => (plan ? getWeeklyChapterCounts(7) : []), [plan, totalRead]);

  const paceMinutes = plan ? estimateDailyMinutes(plan.startBook, plan.chaptersPerDay) : 0;

  const planLabel = plan
    ? (!plan.endBook || plan.endBook === "Revelation")
      ? (plan.startBook === "Genesis" ? "the whole Bible" : `${plan.startBook} to Revelation`)
      : plan.startBook === plan.endBook
        ? plan.startBook
        : `${plan.startBook} to ${plan.endBook}`
    : "";

  const todayReading = useMemo(() => {
    if (!plan) return null;
    return getTodaysReading(
      plan.startBook,
      plan.startChapter,
      plan.chaptersPerDay,
      new Date(plan.startDate + "T00:00:00")
    );
  }, [plan]);

  const todayLabel = useMemo(() => {
    if (!todayReading) return "";
    const { book, startChapter, endChapter, endBook } = todayReading;
    if (endBook) return `${book} ${startChapter} – ${endBook} ${endChapter}`;
    if (startChapter === endChapter) return `${book} ${startChapter}`;
    return `${book} ${startChapter}–${endChapter}`;
  }, [todayReading]);

  // ─── Recalculate pace: re-anchor the plan at the actual position ──
  function handleRecalculate() {
    if (!plan) return;
    if (locked) return; // gated — the wall replaces this screen anyway
    const startIdx = getGlobalChapterIndex(plan.startBook, plan.startChapter);
    const nextUnread = Math.min(startIdx + getTotalChaptersRead(), TOTAL_CHAPTERS - 1);
    const bc = getBookAndChapter(nextUnread);
    const newPlan: SavedPlan = {
      ...plan,
      startBook: bc.book,
      startChapter: bc.chapter,
      startDate: todayDateStr(),
    };
    savePlan(newPlan);
    setPlan(newPlan);
    setAnalysis(getProgressAnalysis(newPlan));
    setRecalculated(true);
  }

  // ─── Onboarding: start the chosen plan ───────────────────────
  function handleStartPlan() {
    if (locked) return; // gated
    const startsFresh = obStage === "fresh";
    let startBook = startsFresh ? "Genesis" : obBook;
    let startChapter = startsFresh ? 1 : obChapter;
    let chaptersPerDay = obPlan === "year" ? 4 : obPlan === "nt90" ? 3 : 1;
    const endBook: string | undefined = undefined; // all three read to Revelation

    const ntStart = getGlobalChapterIndex("Matthew", 1);
    const chosenIdx = getGlobalChapterIndex(startBook, startChapter);

    if (obPlan === "nt90" || obPlan === "psalm") {
      // New Testament plans: keep the user's place if it's in the NT, else Matthew 1
      if (chosenIdx < ntStart) {
        startBook = "Matthew";
        startChapter = 1;
      }
    }

    // Beginner guard: someone "starting fresh" should never open to a heavy first
    // day. If the estimated load tops ~20 minutes, lighten the daily chapters —
    // the finish date stretches instead of the first morning.
    if (startsFresh) {
      while (chaptersPerDay > 1 && estimateDailyMinutes(startBook, chaptersPerDay) > 20) {
        chaptersPerDay--;
      }
    }

    const newPlan: SavedPlan = {
      startBook,
      startChapter,
      chaptersPerDay,
      startDate: todayDateStr(),
      createdAt: new Date().toISOString(),
      endBook,
    };
    savePlan(newPlan);

    // The daily-three habit adds a Psalm and a Proverb alongside
    if (obPlan === "psalm") {
      const existing = getSubPlans();
      if (!existing.some((p) => p.book === "Psalms")) {
        addSubPlan({ label: "Daily Psalm", book: "Psalms", totalChapters: 150, chaptersPerDay: 1, startDate: todayDateStr() });
      }
      if (!existing.some((p) => p.book === "Proverbs")) {
        addSubPlan({ label: "Daily Proverb", book: "Proverbs", totalChapters: 31, chaptersPerDay: 1, startDate: todayDateStr() });
      }
    }

    setReminderTime(obTime);
    setReminderEnabled(true);

    // Welcome email (fire-and-forget). The route is entitlement-gated, so it
    // needs the access token and sends only to the verified account address.
    if (user?.email) {
      const analysisNow = getProgressAnalysis(newPlan);
      authHeaders()
        .then((headers) =>
          fetch("/api/email/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({
              name: user.name,
              startBook,
              startChapter,
              chaptersPerDay,
              finishDate: analysisNow.scheduledFinishDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            }),
          })
        )
        .catch(() => {});
    }

    setPlan(newPlan);
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setAnalysis(getProgressAnalysis(newPlan));
    setMainDoneToday(isDayComplete(formatDate(new Date())));
    refreshSubPlans();
    setPlanMode(obPlan === "psalm" ? "habit" : "goal");
    setOnboarding(false);
    window.location.href = "/today";
  }

  // ─── Loading ─────────────────────────────────────────────────
  if (loading || entLoading) {
    return (
      <div className="bh-app flex flex-col items-center justify-center gap-3" style={{ minHeight: "100vh" }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid var(--gold-500)", borderTopColor: "transparent" }} />
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  // ─── Trial over: the wall stands in for the whole Plan screen ──
  if (locked) {
    return (
      <div className="bh-app">
        <NavBar />
        <TrialWall
          streak={streak}
          chapters={totalRead}
          isNative={isNative}
          signedIn={!!user}
          onRefresh={refreshEntitlement}
        />
      </div>
    );
  }

  // ─── Onboarding wizard ───────────────────────────────────────
  if (onboarding) {
    const tomorrowLabel = (() => {
      const startsFresh = obStage === "fresh";
      const b = startsFresh ? "Genesis" : obBook;
      const c = startsFresh ? 1 : obChapter;
      if (obPlan === "nt90" || obPlan === "psalm") {
        const ntStart = getGlobalChapterIndex("Matthew", 1);
        if (getGlobalChapterIndex(b, c) < ntStart) return "Matthew 1";
      }
      return `${b} ${c}`;
    })();

    const canContinue = obStep === 0 ? true : obStep === 1 ? !!obPlan : !!obTime;

    return (
      <div className="bh-app flex flex-col" style={{ minHeight: "100vh" }}>
        <div className="flex-1 mx-auto w-full max-w-md" style={{ padding: "40px 24px 8px" }}>
          {/* Progress rail */}
          <div className="flex gap-2" style={{ marginBottom: 28 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 3, flex: 1, borderRadius: 999, background: i <= obStep ? "var(--gold-500)" : "var(--surface-sunk)", transition: "background 280ms" }} />
            ))}
          </div>

          {obStep === 0 && (
            <div className="bh-fade">
              <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2 }}>Where are you in your reading?</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, marginBottom: 24 }}>
                No wrong answer — this only decides where we open tomorrow.
              </p>
              <div className="space-y-3">
                {STAGE_CARDS.map((c) => {
                  const selected = obStage === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setObStage(c.id)}
                      className="w-full text-left flex items-start justify-between gap-3"
                      style={{
                        border: `1.5px solid ${selected ? "var(--gold-500)" : "var(--line-hairline)"}`,
                        background: selected ? "var(--gold-100)" : "var(--surface-card)",
                        borderRadius: 14,
                        padding: 16,
                        transition: "border-color 200ms, background 200ms",
                      }}
                    >
                      <div>
                        <h3 className="bh-serif" style={{ fontSize: 19, fontWeight: 500 }}>{c.title}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{c.desc}</p>
                      </div>
                      <span
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 22, height: 22, borderRadius: 999, marginTop: 2,
                          border: selected ? "none" : "1.5px solid var(--line-strong)",
                          background: selected ? "var(--gold-500)" : "transparent",
                          color: "var(--text-on-accent)",
                        }}
                      >
                        {selected && <CheckIcon size={12} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {obStage !== "fresh" && (
                <div className="bh-card" style={{ padding: 16, marginTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>The last chapter you finished</p>
                  <BookPicker selected={obBook} onSelect={(b) => { setObBook(b); setObChapter(1); }} />
                  <div style={{ borderTop: "1px solid var(--line-hairline)", marginTop: 12, paddingTop: 12 }}>
                    <ChapterPicker book={obBook} selected={obChapter} onSelect={setObChapter} />
                  </div>
                </div>
              )}
            </div>
          )}

          {obStep === 1 && (
            <div className="bh-fade">
              <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2 }}>Three that would suit you</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, marginBottom: 24 }}>
                {obStage === "fresh"
                  ? "Light on purpose — showing up daily matters more than page count. You can change it any time."
                  : "Picked for someone already reading most mornings. You can change it any time."}
              </p>
              <div className="space-y-3">
                {PLAN_CARDS.map((c) => {
                  const selected = obPlan === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setObPlan(c.id)}
                      className="w-full text-left flex items-start justify-between gap-3"
                      style={{
                        border: `1.5px solid ${selected ? "var(--gold-500)" : "var(--line-hairline)"}`,
                        background: selected ? "var(--gold-100)" : "var(--surface-card)",
                        borderRadius: 14,
                        padding: 16,
                        transition: "border-color 200ms, background 200ms",
                      }}
                    >
                      <div>
                        <h3 className="bh-serif" style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.3 }}>{c.title}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{c.desc}</p>
                      </div>
                      <span
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 22, height: 22, borderRadius: 999, marginTop: 2,
                          border: selected ? "none" : "1.5px solid var(--line-strong)",
                          background: selected ? "var(--gold-500)" : "transparent",
                          color: "var(--text-on-accent)",
                        }}
                      >
                        {selected && <CheckIcon size={12} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {obStep === 2 && (
            <div className="bh-fade">
              <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2 }}>When shall we leave it out?</h1>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, marginBottom: 24 }}>
                One quiet note, at your hour.
              </p>
              <div className="flex flex-wrap gap-2">
                {REMINDER_TIMES.map((t) => {
                  const selected = obTime === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setObTime(t)}
                      style={{
                        height: 44,
                        padding: "0 18px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 600,
                        border: `1.5px solid ${selected ? "var(--gold-500)" : "var(--line-strong)"}`,
                        background: selected ? "var(--gold-100)" : "var(--surface-card)",
                        color: selected ? "var(--gold-700)" : "var(--text-secondary)",
                        transition: "border-color 200ms, background 200ms, color 200ms",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <div style={{ background: "var(--sage-100)", borderRadius: 14, padding: 16, marginTop: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--sage-700)" }}>
                  {`“${tomorrowLabel} is ready when you are”`}
                </p>
                <p style={{ fontSize: 13, color: "var(--sage-700)", opacity: 0.8, marginTop: 4 }}>
                  Once, at {obTime}. Never a catch-up, never a countdown.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mx-auto w-full max-w-md" style={{ padding: "14px 24px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
          <button
            onClick={() => {
              if (obStep === 0) {
                // Beginners default to the lightest plan; readers to the classic.
                setObPlan(obStage === "fresh" ? "psalm" : "year");
                setObStep(1);
              } else if (obStep < 2) {
                setObStep(obStep + 1);
              } else {
                handleStartPlan();
              }
            }}
            disabled={!canContinue}
            className="bh-btn bh-btn-primary"
          >
            {obStep < 2 ? "Continue" : "Start reading"}
          </button>
          <button
            onClick={() => (obStep > 0 ? setObStep(obStep - 1) : (window.location.href = "/today"))}
            className="bh-btn bh-btn-quiet"
            style={{ marginTop: 4 }}
          >
            {obStep > 0 ? "Back" : "Not now"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Plan view ────────────────────────────────────────────────
  const finishDate = analysis ? formatFinishDate(analysis.projectedFinishDate) : "—";
  const habitRows = (() => {
    const rows: { id: string; label: string; minutes: number; done: boolean; streak: number; isMain: boolean }[] = [];
    for (const sp of subPlans) {
      rows.push({
        id: sp.id,
        label: `${sp.book} ${getSubPlanChapterToday(sp)}`,
        minutes: Math.max(1, Math.round(sp.chaptersPerDay * estimateChapterMinutes(sp.book))),
        done: subPlanDone.has(sp.id),
        streak: getSubPlanStreak(sp.id),
        isMain: false,
      });
    }
    if (todayLabel) {
      rows.push({
        id: "__main__",
        label: todayLabel,
        minutes: paceMinutes,
        done: mainDoneToday,
        streak,
        isMain: true,
      });
    }
    return rows;
  })();
  const habitDoneCount = habitRows.filter((r) => r.done).length;

  const pacingCopy = (() => {
    if (!analysis) return "";
    if (analysis.daysBehind > 0)
      return recalculated
        ? "The remaining chapters are spread evenly from today. Nothing was lost."
        : `A few days behind — recalculating spreads the difference gently over the weeks ahead.`;
    if (analysis.daysAhead >= 2)
      return "A little ahead of the plan — the finish date is quietly drifting closer.";
    return "Right on pace. Nothing needs adjusting today.";
  })();

  return (
    <div className="bh-app">
      <NavBar />
      <div className="max-w-2xl mx-auto" style={{ padding: "20px 20px 28px" }}>

        {ent?.status === "trialing" && (
          <TrialBanner daysLeft={ent.daysLeft} isNative={isNative} />
        )}

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <p className="bh-eyebrow" style={{ color: "var(--text-accent)", marginBottom: 4 }}>
            {planMode === "goal" ? "Your plan" : "Your daily readings"}
          </p>
          <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2 }}>
            {planMode === "goal" ? <>Finish {planLabel} by {finishDate}</> : <>Today&apos;s readings, side by side</>}
          </h1>
        </div>

        {/* Segmented control */}
        <div className="flex" style={{ background: "var(--surface-sunk)", borderRadius: 999, padding: 3, marginBottom: 20 }}>
          {([["goal", "Destination"], ["habit", "Daily habit"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setPlanMode(id)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                background: planMode === id ? "var(--surface-card)" : "transparent",
                color: planMode === id ? "var(--text-body)" : "var(--text-muted)",
                boxShadow: planMode === id ? "var(--shadow-rest)" : "none",
                transition: "background 280ms, color 280ms",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {planMode === "goal" ? (
          <div className="space-y-4">
            {/* Arc */}
            <div className="bh-card-hero flex flex-col items-center" style={{ padding: "28px 20px 20px" }}>
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 999,
                  background: `conic-gradient(var(--gold-500) 0% ${actualPct}%, var(--gold-200) ${actualPct}% ${Math.max(actualPct, expectedPct)}%, var(--cream-200) ${Math.max(actualPct, expectedPct)}% 100%)`,
                  transition: "background 420ms var(--ease-bh)",
                }}
              >
                <div className="flex flex-col items-center justify-center" style={{ width: 174, height: 174, borderRadius: 999, background: "var(--cream-50)" }}>
                  <span className="bh-serif" style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.15 }}>{totalRead}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>of {totalPlanChapters} chapters</span>
                </div>
              </div>
              <div className="flex items-center gap-4" style={{ marginTop: 16 }}>
                <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--gold-500)" }} /> Where you are
                </span>
                <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--gold-200)" }} /> Where the plan expected
                </span>
              </div>
            </div>

            {/* Pacing card */}
            <div style={{ background: "var(--sage-100)", borderRadius: 14, padding: 20 }}>
              <p className="bh-eyebrow" style={{ color: "var(--sage-700)", marginBottom: 8 }}>The pacing engine</p>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--sage-700)" }}>{pacingCopy}</p>
              <h2 className="bh-serif" style={{ fontSize: 24, fontWeight: 500, marginTop: 10, color: "var(--text-body)" }}>
                {recalculated ? "New pace" : "Your pace"}: {paceMinutes} min a day
              </h2>
              <p style={{ fontSize: 13, color: "var(--sage-700)", marginTop: 2 }}>
                about {plan!.chaptersPerDay} chapter{plan!.chaptersPerDay > 1 ? "s" : ""}
              </p>
            </div>

            {/* Pace history */}
            <div className="bh-card" style={{ padding: 20 }}>
              <div className="flex items-baseline justify-between" style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>How fast you actually read</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>last 7 weeks</p>
              </div>
              {weeklyCounts.some((c) => c > 0) ? (
                <div className="flex items-end gap-2" style={{ height: 72 }}>
                  {weeklyCounts.map((c, i) => {
                    const max = Math.max(...weeklyCounts, 1);
                    const isCurrent = i === weeklyCounts.length - 1;
                    return (
                      <div
                        key={i}
                        className="flex-1"
                        style={{
                          height: c === 0 ? 6 : Math.max(6, (c / max) * 72),
                          borderRadius: "6px 6px 0 0",
                          background: c === 0 ? "var(--cream-200)" : isCurrent ? "var(--gold-500)" : "var(--gold-200)",
                          transition: "height 420ms var(--ease-bh)",
                        }}
                        title={`${c} chapters`}
                      />
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Your first weeks of reading will appear here.
                </p>
              )}
            </div>

            {/* Recalculate */}
            <button onClick={handleRecalculate} className="bh-btn bh-btn-secondary">
              {recalculated ? "Pace updated — recalculate again" : "Recalculate my pace"}
            </button>
            <p className="text-center" style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)", padding: "0 12px" }}>
              Nothing is lost when a day goes by. The date moves, or the daily load does — your choice.
            </p>
          </div>
        ) : (
          /* ─── Daily habit checklist ─────────────────────────── */
          <div className="space-y-3">
            {habitRows.map((row) => (
              <div
                key={row.id}
                className="flex items-start gap-3"
                style={{
                  background: row.done ? "var(--sage-100)" : "var(--surface-card)",
                  border: `1px solid ${row.done ? "#D3DCCC" : "var(--line-hairline)"}`,
                  borderRadius: 14,
                  boxShadow: "var(--shadow-rest)",
                  padding: 16,
                  transition: "background 280ms, border-color 280ms",
                }}
              >
                <button
                  onClick={() => {
                    if (row.done) return;
                    if (row.isMain) {
                      window.location.href = "/today";
                    } else {
                      markSubPlanDone(row.id);
                      refreshSubPlans();
                    }
                  }}
                  aria-label={row.done ? "Read" : "Mark read"}
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    marginTop: 2,
                    border: row.done ? "none" : "1.5px solid var(--line-strong)",
                    background: row.done ? "var(--sage-500)" : "transparent",
                    color: "#FFFDF7",
                    transition: "background 200ms",
                  }}
                >
                  {row.done && <CheckIcon size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="bh-serif" style={{ fontSize: 19, fontWeight: 500 }}>{row.label}</h3>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>about {row.minutes} min</span>
                  </div>
                  {row.streak > 0 && (
                    <p className="flex items-center gap-1" style={{ fontSize: 13, marginTop: 4, color: row.done ? "var(--sage-700)" : "var(--text-muted)" }}>
                      <SunriseIcon size={14} /> {row.streak === 1 ? "Read today" : `${row.streak} mornings in a row`}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="bh-sunk" style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>
                {habitDoneCount} of {habitRows.length} read today
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                {habitDoneCount === habitRows.length && habitRows.length > 0
                  ? "That's the set. The next one is already waiting for tomorrow."
                  : "Whatever you leave simply waits — nothing carries a penalty."}
              </p>
            </div>

            {habitRows.length < 3 && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                Add a Psalm or a Proverb from the Today screen to build your daily three.
              </p>
            )}

            <a href="/today" className="bh-btn bh-btn-primary">
              {habitDoneCount === habitRows.length && habitRows.length > 0 ? "Read something else" : "Open the next one"}
            </a>
          </div>
        )}

        {/* Change plan */}
        <div className="text-center" style={{ marginTop: 24 }}>
          <button
            onClick={() => { setOnboarding(true); setObStep(0); }}
            style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Change reading plan
          </button>
        </div>
      </div>
    </div>
  );
}
