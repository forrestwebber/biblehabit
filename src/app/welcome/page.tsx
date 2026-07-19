"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BIBLE_BOOKS } from "@/lib/bible-data";
import {
  positionToChapterIndex,
  computePace,
  suggestGoals,
  type GoalSuggestion,
} from "@/lib/pacing";

const PARCHMENT = "#F7F2E8";
const CARD = "#EFE7D6";
const INK = "#221C14";
const SOFT_INK = "#5A4F3F";
const GOLD = "#C9962E";
const GOLD_HOVER = "#B5841F";

function StepFrame({
  step,
  question,
  children,
  onBack,
  onContinue,
  continueDisabled,
  continueLabel = "Continue",
}: {
  step: number;
  question: string;
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
        fontFamily: "-apple-system, 'Segoe UI', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: 2,
            color: SOFT_INK,
            textTransform: "uppercase",
          }}
        >
          Step {step} of 3
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, margin: "10px 0 20px" }}>
          {question}
        </div>
        {children}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          {onBack ? (
            <button
              onClick={onBack}
              style={{
                borderRadius: 8,
                padding: "11px 18px",
                fontSize: 14,
                fontWeight: 600,
                border: `1.5px solid ${SOFT_INK}`,
                background: "transparent",
                color: SOFT_INK,
                cursor: "pointer",
              }}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {onContinue && (
            <button
              onClick={onContinue}
              disabled={continueDisabled}
              style={{
                borderRadius: 8,
                padding: "11px 18px",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                background: continueDisabled ? "#DDD2B8" : GOLD,
                color: INK,
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

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 answers
  const [book, setBook] = useState("Jeremiah");
  const [chapter, setChapter] = useState(22);
  const [startedApprox, setStartedApprox] = useState<"recent" | "months" | "long">("months");

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

  // Derive an approximate history point from "how long have you been reading"
  // to seed the pacing engine, per the no-shame, meet-them-where-they-are spec.
  const approxDaysAgo = startedApprox === "recent" ? 14 : startedApprox === "months" ? 180 : 540;

  const pace = useMemo(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - approxDaysAgo);
    return computePace([
      { date: startDate.toISOString(), chapterIndex: 0 },
      { date: new Date().toISOString(), chapterIndex: currentChapterIndex },
    ]);
  }, [approxDaysAgo, currentChapterIndex]);

  const suggestions = useMemo(
    () => suggestGoals(currentChapterIndex, pace.chaptersPerDay, new Date()),
    [currentChapterIndex, pace.chaptersPerDay]
  );

  const selectedBook = BIBLE_BOOKS.find((b) => b.name === book);

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

      const { error: posErr } = await supabase.from("reading_positions").insert({
        user_id: user.id,
        book,
        chapter,
        source: "onboarding",
      });
      if (posErr) throw posErr;

      router.push("/today");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong saving your plan.");
    } finally {
      setSaving(false);
    }
  }

  if (step === 1) {
    return (
      <StepFrame
        step={1}
        question="Where are you in your reading right now?"
        onContinue={() => setStep(2)}
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <select
            value={book}
            onChange={(e) => {
              setBook(e.target.value);
              setChapter(1);
            }}
            style={{
              flex: 1,
              background: CARD,
              border: "none",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 15,
              color: INK,
            }}
          >
            {BIBLE_BOOKS.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={chapter}
            onChange={(e) => setChapter(Number(e.target.value))}
            style={{
              width: 100,
              background: CARD,
              border: "none",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 15,
              color: INK,
            }}
          >
            {Array.from({ length: selectedBook?.chapters ?? 1 }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 14, color: SOFT_INK, marginBottom: 10 }}>
          About how long have you been reading?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "recent" as const, label: "Just started — a couple weeks" },
            { id: "months" as const, label: "A few months" },
            { id: "long" as const, label: "A year or more" },
          ].map((opt) => (
            <div
              key={opt.id}
              onClick={() => setStartedApprox(opt.id)}
              style={{
                background: CARD,
                borderRadius: 12,
                padding: "16px 18px",
                fontSize: 15,
                cursor: "pointer",
                border: startedApprox === opt.id ? `2px solid ${GOLD}` : "2px solid transparent",
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </StepFrame>
    );
  }

  if (step === 2) {
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
            borderRadius: 12,
            padding: "28px 32px",
            boxShadow: "0 6px 20px rgba(34,28,20,.08)",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            You're at <span>{book} {chapter}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: SOFT_INK }}>
            That's chapter {currentChapterIndex} of 1,189 — reading at roughly{" "}
            {Math.round(pace.chaptersPerDay * 10) / 10} chapters/day. No matter the pace,
            you're already reading — we'll help you keep going from right here.
          </div>
        </div>
      </StepFrame>
    );
  }

  return (
    <StepFrame
      step={3}
      question="Pick a plan that fits your life"
      onBack={() => setStep(2)}
      onContinue={finish}
      continueDisabled={!selectedGoal || saving}
      continueLabel={saving ? "Saving..." : "Start"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {suggestions.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedGoal(s)}
            style={{
              background: CARD,
              border: selectedGoal?.id === s.id ? `2px solid ${GOLD}` : "2px solid transparent",
              borderRadius: 12,
              padding: "22px 26px",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600 }}>{s.title}</div>
            <div style={{ marginTop: 8, fontSize: 14, color: SOFT_INK }}>{s.description}</div>
          </div>
        ))}
      </div>
      {error && (
        <div style={{ marginTop: 14, fontSize: 13, color: "#B5841F" }}>{error}</div>
      )}
    </StepFrame>
  );
}
