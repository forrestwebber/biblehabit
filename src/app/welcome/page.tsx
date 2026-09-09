"use client";

/**
 * /welcome — first-run onboarding.
 *
 * Rebuilt 2026-09-09 to the Claude Design app handoff
 * (~/sol-ops-media/biblehabit-design-handoff/design_handoff_biblehabit/README.md).
 * Presentation only: the pacing engine, the goal suggestions and the Supabase
 * writes below are untouched — the old screen was three bare native <select>s
 * on an empty parchment page, which is what a new installer has been seeing.
 *
 * Where this deliberately departs from the handoff: the handoff's step 2 asks
 * "About when did you start?" with three coarse buckets (within a year / 1-2
 * years / longer). We keep the month+year selects, because computePace() uses
 * the real date and a bucket would make every returning reader's pace worse.
 * The warmth the buckets were there for is carried by the copy instead.
 *
 * Product rules the handoff insists on, honoured here: never more than three
 * choices in a group, no shame mechanics, and honest pace math (1,189 chapters).
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { savePlan } from "@/lib/reading-store";
import { BIBLE_BOOKS } from "@/lib/bible-data";
import {
  positionToChapterIndex,
  computePace,
  suggestGoals,
  type GoalSuggestion,
} from "@/lib/pacing";

const PARCHMENT = "#F7F2E8";
const CARD = "#FFFDF7";
const CHIP = "#F3EAD6";
const SELECTED_BG = "#F6ECD3";
const INK = "#221C14";
const MUTED = "#6B5F4B";
const SOFTER = "#8A7A5C";
const FAINT = "#A08A63";
const GOLD = "#C9962E";
const GOLD_ON_TINT = "#8A6C22";
const BORDER = "#E3D6B9";
const EMPTY_SEG = "#E4D6B8";
const DIVIDER = "#EFE3C8";
const SERIF = "var(--font-serif)";

const TOTAL_CHAPTERS = 1189;

/* ------------------------------------------------------------------ frame */

function StepFrame({
  step,
  question,
  subcopy,
  children,
  onBack,
  onContinue,
  continueDisabled,
  continueLabel = "Continue",
}: {
  step: number;
  question: string;
  subcopy?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: PARCHMENT,
        color: INK,
        display: "flex",
        justifyContent: "center",
        padding: "clamp(28px,7vw,74px) 26px 34px",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%", display: "flex", flexDirection: "column" }}>
        <p
          className="uppercase"
          style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: GOLD, marginBottom: 14 }}
        >
          Step {step} of 3
        </p>

        {/* Three-segment progress bar — one more segment fills per step. */}
        <div style={{ display: "flex", gap: 6, marginBottom: 26 }} aria-hidden>
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? GOLD : EMPTY_SEG,
              }}
            />
          ))}
        </div>

        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: "clamp(26px,5.6vw,31px)",
            lineHeight: 1.2,
            letterSpacing: "-0.4px",
            color: INK,
            marginBottom: subcopy ? 10 : 24,
          }}
        >
          {question}
        </h1>
        {subcopy && (
          <p style={{ fontSize: 16, lineHeight: 1.55, color: MUTED, marginBottom: 26 }}>{subcopy}</p>
        )}

        {children}

        <div style={{ marginTop: "auto", paddingTop: 30, display: "flex", gap: 12 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                borderRadius: 14,
                padding: "17px 22px",
                fontSize: 16,
                fontWeight: 600,
                border: `1.5px solid ${BORDER}`,
                background: "transparent",
                color: MUTED,
                cursor: "pointer",
              }}
            >
              Back
            </button>
          )}
          {onContinue && (
            <button
              onClick={onContinue}
              disabled={continueDisabled}
              style={{
                flex: 1,
                borderRadius: 14,
                padding: 17,
                fontSize: 18,
                fontWeight: 600,
                border: "none",
                background: continueDisabled ? "#E6DCC4" : GOLD,
                color: continueDisabled ? SOFTER : "#F7F2E8",
                boxShadow: continueDisabled ? "none" : "0 8px 20px rgba(201,150,46,.32)",
                cursor: continueDisabled ? "not-allowed" : "pointer",
              }}
            >
              {continueLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ option card */

function OptionCard({
  selected,
  onClick,
  title,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        textAlign: "left",
        background: selected ? SELECTED_BG : CARD,
        border: selected ? `2px solid ${GOLD}` : `1.5px solid ${BORDER}`,
        borderRadius: 16,
        padding: sub ? "22px 20px" : "15px 18px",
        boxShadow: selected
          ? "0 8px 22px rgba(201,150,46,.20)"
          : "0 4px 16px rgba(120,90,30,.06)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: sub ? 21 : 17, color: INK, display: "block" }}>
        {title}
      </span>
      {sub && <span style={{ fontSize: 15, color: MUTED, display: "block", marginTop: 4 }}>{sub}</span>}
      {selected && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: sub ? 20 : 14,
            right: 18,
            width: 26,
            height: 26,
            borderRadius: 999,
            background: GOLD,
            color: "#F7F2E8",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✓
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------- page */

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 answers
  const [book, setBook] = useState("Jeremiah");
  const [chapter, setChapter] = useState(22);
  // "When did you start?" — month/year select, or "I don't know". Nothing preselected.
  const [startMonth, setStartMonth] = useState<number | "">("");
  const [startYear, setStartYear] = useState<number | "">("");
  const [dontKnowStart, setDontKnowStart] = useState(false);

  // Step 3
  const [selectedGoal, setSelectedGoal] = useState<GoalSuggestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentChapterIndex = useMemo(() => {
    try {
      return positionToChapterIndex(book, chapter);
    } catch {
      return 1;
    }
  }, [book, chapter]);

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth(); // 0-11
  const YEAR_OPTIONS = useMemo(
    () => Array.from({ length: currentYear - 2018 + 1 }, (_, i) => 2018 + i).reverse(),
    [currentYear]
  );
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Real start date derived from month+year, or the "I don't know" neutral
  // default. "I don't know" reuses the same ~180-days-ago estimate the old
  // "A few months" bucket fed into the pacing engine, so pacing math (which
  // needs two dated history points) stays well-behaved for unknown starts.
  const startDate = useMemo(() => {
    if (startMonth !== "" && startYear !== "") {
      return new Date(startYear, startMonth, 1);
    }
    if (dontKnowStart) {
      const d = new Date();
      d.setDate(d.getDate() - 180);
      return d;
    }
    return null;
  }, [startMonth, startYear, dontKnowStart]);

  const pace = useMemo(() => {
    const from = startDate ?? new Date(new Date().setDate(new Date().getDate() - 180));
    return computePace([
      { date: from.toISOString(), chapterIndex: 0 },
      { date: new Date().toISOString(), chapterIndex: currentChapterIndex },
    ]);
  }, [startDate, currentChapterIndex]);

  const suggestions = useMemo(
    () => suggestGoals(currentChapterIndex, pace.chaptersPerDay, new Date()),
    [currentChapterIndex, pace.chaptersPerDay]
  );

  const selectedBook = BIBLE_BOOKS.find((b) => b.name === book);
  const bookIndex = BIBLE_BOOKS.findIndex((b) => b.name === book);
  const maxChapter = selectedBook?.chapters ?? 1;

  // A five-wide chapter window centred on the current chapter, clamped to the book.
  const chapterWindow = useMemo(() => {
    const start = Math.max(1, Math.min(chapter - 2, maxChapter - 4));
    return Array.from({ length: Math.min(5, maxChapter) }, (_, i) => start + i).filter(
      (c) => c >= 1 && c <= maxChapter
    );
  }, [chapter, maxChapter]);

  const selectStyle: React.CSSProperties = {
    background: CHIP,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 13,
    padding: "14px 16px",
    fontSize: 15,
    color: INK,
    width: "100%",
    appearance: "none",
  };

  async function finish() {
    if (!selectedGoal) return;
    setSaving(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        router.push("/login?mode=signup&next=/welcome");
        return;
      }

      const { data: goalRow, error: goalErr } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          type: selectedGoal.type,
          target_date: selectedGoal.targetDate
            ? selectedGoal.targetDate.toISOString().slice(0, 10)
            : null,
          daily_components: selectedGoal.dailyComponents ?? null,
          active: true,
        })
        .select()
        .single();

      if (goalErr) throw goalErr;
      void goalRow;

      const { error: posErr } = await supabase.from("reading_positions").insert({
        user_id: user.id,
        book,
        chapter,
        source: "onboarding",
      });
      if (posErr) throw posErr;

      // /today does NOT read the `goals` table — it reads getPlan() out of
      // localStorage (src/lib/reading-store.ts), which only /plans and
      // /dashboard ever wrote. So finishing onboarding used to land a brand-new
      // reader on "No Reading Plan Yet", which is the emptiest possible first
      // impression and was live in the shipped App Store build. Write the plan
      // the goal implies. savePlan() also syncs it to Supabase.
      const dailyLoad = selectedGoal.dailyLoad ?? pace.chaptersPerDay;
      savePlan({
        startBook: book,
        startChapter: chapter,
        // A habit bundle is Psalm + Proverb + NT = 3 chapters; never round to 0.
        chaptersPerDay: Math.max(1, Math.round(dailyLoad || (selectedGoal.type === "habit" ? 3 : 1))),
        startDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      });

      router.push("/today");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong saving your plan.");
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------- step 1 */
  if (step === 1) {
    return (
      <StepFrame
        step={1}
        question="Where are you in your reading right now?"
        subcopy="No wrong answer — this only decides where we open tomorrow."
        onContinue={() => setStep(2)}
        continueDisabled={!dontKnowStart && (startMonth === "" || startYear === "")}
      >
        {/* Book + chapter picker */}
        <div
          style={{
            background: CARD,
            border: `1.5px solid ${BORDER}`,
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 6px 18px rgba(120,90,30,.07)",
            marginBottom: 24,
          }}
        >
          <label
            htmlFor="book"
            className="uppercase"
            style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: FAINT, display: "block", marginBottom: 8 }}
          >
            Book
          </label>
          <select
            id="book"
            value={book}
            onChange={(e) => {
              setBook(e.target.value);
              setChapter(1);
            }}
            style={{ ...selectStyle, fontFamily: SERIF, fontSize: 22, fontWeight: 600, padding: "12px 16px" }}
          >
            {BIBLE_BOOKS.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>
            Book {bookIndex + 1} of 66 · {maxChapter} chapters
          </p>

          <div style={{ height: 1, background: DIVIDER, margin: "16px 0" }} />

          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <label
              className="uppercase"
              style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: FAINT }}
            >
              Chapter
            </label>
            <span style={{ fontSize: 13, color: SOFTER }}>
              {book} {chapter}
            </span>
          </div>

          <div className="flex items-center" style={{ gap: 6 }}>
            <button
              onClick={() => setChapter((c) => Math.max(1, c - 1))}
              disabled={chapter <= 1}
              aria-label="Previous chapter"
              style={{ background: "transparent", border: "none", color: chapter <= 1 ? EMPTY_SEG : SOFTER, fontSize: 20, padding: "0 4px", cursor: chapter <= 1 ? "default" : "pointer" }}
            >
              ‹
            </button>
            {chapterWindow.map((c) => {
              const on = c === chapter;
              return (
                <button
                  key={c}
                  onClick={() => setChapter(c)}
                  aria-pressed={on}
                  style={{
                    flex: on ? 1.3 : 1,
                    fontFamily: SERIF,
                    fontSize: on ? 26 : 19,
                    fontWeight: on ? 600 : 400,
                    padding: on ? "8px 0" : "10px 0",
                    borderRadius: on ? 13 : 11,
                    border: "none",
                    background: on ? GOLD : CHIP,
                    color: on ? "#F7F2E8" : SOFTER,
                    boxShadow: on ? "0 6px 16px rgba(201,150,46,.3)" : "none",
                    cursor: "pointer",
                  }}
                >
                  {c}
                </button>
              );
            })}
            <button
              onClick={() => setChapter((c) => Math.min(maxChapter, c + 1))}
              disabled={chapter >= maxChapter}
              aria-label="Next chapter"
              style={{ background: "transparent", border: "none", color: chapter >= maxChapter ? EMPTY_SEG : SOFTER, fontSize: 20, padding: "0 4px", cursor: chapter >= maxChapter ? "default" : "pointer" }}
            >
              ›
            </button>
          </div>
        </div>

        {/* When did you start */}
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: INK, marginBottom: 6 }}>
          About when did you start?
        </h2>
        <p style={{ fontSize: 15, color: MUTED, marginBottom: 14 }}>
          Rough is fine — it just helps us pace you kindly.
        </p>

        <div className="flex" style={{ gap: 10, marginBottom: 10 }}>
          <select
            aria-label="Start month"
            value={startMonth}
            onChange={(e) => {
              const val = e.target.value === "" ? "" : Number(e.target.value);
              setStartMonth(val);
              setDontKnowStart(false);
            }}
            style={selectStyle}
          >
            <option value="" disabled hidden>
              Month
            </option>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i} disabled={startYear === currentYear && i > currentMonthIndex}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="Start year"
            value={startYear}
            onChange={(e) => {
              const val = e.target.value === "" ? "" : Number(e.target.value);
              setStartYear(val);
              setDontKnowStart(false);
              if (val === currentYear && startMonth !== "" && startMonth > currentMonthIndex) {
                setStartMonth("");
              }
            }}
            style={selectStyle}
          >
            <option value="" disabled hidden>
              Year
            </option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <OptionCard
          selected={dontKnowStart}
          onClick={() => {
            setDontKnowStart(true);
            setStartMonth("");
            setStartYear("");
          }}
          title="I don't know"
        />
      </StepFrame>
    );
  }

  /* ------------------------------------------------------------- step 2 */
  if (step === 2) {
    const pct = Math.round((currentChapterIndex / TOTAL_CHAPTERS) * 100);
    return (
      <StepFrame
        step={2}
        question="Here's where that puts you"
        onBack={() => setStep(1)}
        onContinue={() => setStep(3)}
      >
        <div
          style={{
            background: CARD,
            border: `1.5px solid ${BORDER}`,
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 10px 26px rgba(120,90,30,.10)",
          }}
        >
          <p className="uppercase" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: GOLD, marginBottom: 10 }}>
            You&apos;re here
          </p>
          <p style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, color: INK, letterSpacing: "-0.01em" }}>
            {book} {chapter}
          </p>
          <p style={{ fontSize: 14, color: SOFTER, marginTop: 4 }}>
            Chapter {currentChapterIndex.toLocaleString()} of {TOTAL_CHAPTERS.toLocaleString()}
          </p>

          <div style={{ height: 10, borderRadius: 999, background: "#EFE7D5", overflow: "hidden", margin: "18px 0 8px" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#E7B84E,#C9962E)" }} />
          </div>
          <p style={{ fontSize: 13, color: SOFTER }}>{pct}% of the way through</p>
        </div>

        {/* Kind pace note — sage, never alarming. */}
        <div
          className="flex"
          style={{ gap: 12, background: "#F1F3EC", border: "1px solid #DCE3CE", borderRadius: 14, padding: 18, marginTop: 16 }}
        >
          <span aria-hidden style={{ fontSize: 24, lineHeight: 1 }}>🌤</span>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: "#4C5A3B" }}>
            That&apos;s about{" "}
            <strong style={{ fontWeight: 600 }}>
              {Math.round(pace.chaptersPerDay * 10) / 10} chapters a day
            </strong>
            . However fast that is, you&apos;re already reading — we&apos;ll keep going from right here.
          </p>
        </div>
      </StepFrame>
    );
  }

  /* ------------------------------------------------------------- step 3 */
  return (
    <StepFrame
      step={3}
      question="What's your goal?"
      subcopy={`Three that fit your pace — ${(TOTAL_CHAPTERS - currentChapterIndex).toLocaleString()} chapters to go.`}
      onBack={() => setStep(2)}
      onContinue={finish}
      continueDisabled={!selectedGoal || saving}
      continueLabel={saving ? "Saving…" : "Begin — one tap"}
    >
      <div className="flex flex-col" style={{ gap: 13 }}>
        {suggestions.map((s, i) => {
          const on = selectedGoal?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedGoal(s)}
              aria-pressed={on}
              style={{
                position: "relative",
                display: "block",
                width: "100%",
                textAlign: "left",
                background: on ? SELECTED_BG : CARD,
                border: on ? `2px solid ${GOLD}` : `1.5px solid ${BORDER}`,
                borderRadius: 16,
                padding: "22px 20px",
                marginTop: i === 0 ? 11 : 0,
                boxShadow: on ? "0 8px 22px rgba(201,150,46,.20)" : "0 4px 16px rgba(120,90,30,.06)",
                cursor: "pointer",
              }}
            >
              {i === 0 && (
                <span
                  className="uppercase"
                  style={{
                    position: "absolute",
                    top: -11,
                    left: 18,
                    background: GOLD,
                    color: "#F7F2E8",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  Best fit for you
                </span>
              )}
              <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: INK, display: "block" }}>
                {s.title}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: MUTED, display: "block", marginTop: 6 }}>
                {s.description}
              </span>
              {on && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 18,
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: GOLD,
                    color: "#F7F2E8",
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p style={{ marginTop: 14, fontSize: 13, color: GOLD_ON_TINT }}>{error}</p>}
    </StepFrame>
  );
}
