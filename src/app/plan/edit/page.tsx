"use client";

/**
 * Adjust my plan — the manual override screen.
 *
 * Why this exists (Forrest, 2026-08-02): "i'm on chapter 45 of genesis, and I
 * think I should be able to say that ... especially if someone reads both a
 * physical bible and uses this app, manual adjustments might be necessary."
 *
 * The Plan tab could only (a) re-run onboarding's preset picker or (b) infer
 * your position from chapters logged IN the app — neither of which can express
 * "I read ahead in my paper Bible." This screen edits the three things a
 * SavedPlan actually stores: where you are, how fast you read, and how far you
 * intend to go. Every chapter of every book is selectable (the old marketing
 * mockup offered Ch. 1/2/3/5/10/15/20/25 and nothing else).
 *
 * Re-anchoring only moves the plan's start pointer + start date. Completed
 * days stay in reading_progress (keyed by date + global chapter index), so
 * streaks and totals survive an adjustment.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { getPlan, savePlan, type SavedPlan } from "@/lib/reading-store";
import { BIBLE_BOOKS, getChaptersInPlan } from "@/lib/bible-data";
import { chaptersForMinutes, estimateDailyMinutes } from "@/lib/reading-time";
import { useEntitlement } from "@/lib/use-entitlement";
import ProUpsell from "@/components/ProUpsell";
import { getCurrentStreak, getTotalChaptersRead } from "@/lib/reading-store";
import NavBar from "@/components/NavBar";

// Forrest, 2026-08-02: "1 minute per day, 5 min per day, 10 per day, or custom".
// A one-minute floor matters — the whole promise is that a tiny daily amount
// still finishes the book, and someone who can only give a minute should be
// able to say so instead of rounding themselves up to a pace they will drop.
const PACE_CHOICES = [1, 5, 10];
const CUSTOM_MINUTES = Array.from({ length: 90 }, (_, i) => i + 1);

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function PlanEditPage() {
  // PRO ONLY (2026-08-03). This screen IS the customization Pro sells: where you
  // are, how fast you read, how far you go. The free tier reads the fixed Bible
  // in a Year plan, so there is nothing here for it to adjust.
  const { pro, isNative, refresh: refreshEntitlement } = useEntitlement();
  const [loaded, setLoaded] = useState(false);
  const [noPlan, setNoPlan] = useState(false);
  const [saved, setSaved] = useState(false);

  const [book, setBook] = useState("Genesis");
  const [chapter, setChapter] = useState(1);
  const [minutes, setMinutes] = useState(15);
  const [endBook, setEndBook] = useState<string>("Revelation");
  // Custom pace: any whole number of minutes, not just the three presets.
  const [customOpen, setCustomOpen] = useState(false);

  // Seed the form from the live plan
  useEffect(() => {
    const plan = getPlan();
    if (!plan) {
      setNoPlan(true);
      setLoaded(true);
      return;
    }
    setBook(plan.startBook);
    setChapter(plan.startChapter);
    const mins = estimateDailyMinutes(plan.startBook, plan.chaptersPerDay);
    setMinutes(mins);
    if (!PACE_CHOICES.includes(mins)) setCustomOpen(true);
    setEndBook(plan.endBook ?? "Revelation");
    setLoaded(true);
  }, []);

  const chaptersInBook = useMemo(
    () => BIBLE_BOOKS.find((b) => b.name === book)?.chapters ?? 1,
    [book]
  );

  // Chapter must stay inside the selected book
  useEffect(() => {
    setChapter((c) => Math.min(c, chaptersInBook));
  }, [chaptersInBook]);

  // The end book can never precede the book you're currently in
  const endBookOptions = useMemo(() => {
    const startIdx = BIBLE_BOOKS.findIndex((b) => b.name === book);
    return BIBLE_BOOKS.slice(startIdx);
  }, [book]);

  useEffect(() => {
    if (!endBookOptions.some((b) => b.name === endBook)) {
      setEndBook(endBookOptions[endBookOptions.length - 1]?.name ?? "Revelation");
    }
  }, [endBookOptions, endBook]);

  const chaptersPerDay = chaptersForMinutes(minutes);
  const realMinutes = estimateDailyMinutes(book, chaptersPerDay);

  const remaining = useMemo(
    () => getChaptersInPlan(book, chapter, endBook === "Revelation" ? undefined : endBook),
    [book, chapter, endBook]
  );
  const days = Math.max(1, Math.ceil(remaining / chaptersPerDay));
  const finish = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }, [days]);

  function handleSave() {
    const existing = getPlan();
    const next: SavedPlan = {
      ...(existing ?? { createdAt: new Date().toISOString() }),
      startBook: book,
      startChapter: chapter,
      chaptersPerDay,
      startDate: todayDateStr(),
      endBook: endBook === "Revelation" ? undefined : endBook,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    savePlan(next);
    setSaved(true);
  }

  if (!pro) {
    return (
      <div className="bh-app" style={{ paddingBottom: 120 }}>
        <NavBar />
        <ProUpsell
          inlineHeading="Read at your own pace"
          streak={getCurrentStreak()}
          chapters={getTotalChaptersRead()}
          isNative={isNative}
          signedIn
          onRefresh={refreshEntitlement}
        />
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="bh-app">
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px" }} />
      </div>
    );
  }

  if (noPlan) {
    return (
      <div className="bh-app" style={{ paddingBottom: 120 }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px" }}>
          <h1 className="bh-serif" style={{ fontSize: 28, fontWeight: 500, marginBottom: 10 }}>
            No plan yet
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.55 }}>
            Start a reading plan first — then you can adjust the pace and your position here any time.
          </p>
          <Link href="/dashboard" className="bh-btn bh-btn-primary">
            Start a plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bh-app" style={{ paddingBottom: 140 }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 20px 0" }}>
        {/* Header */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5"
          style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 18, textDecoration: "none" }}
        >
          <ArrowLeft className="h-4 w-4" /> Plan
        </Link>

        <p className="bh-eyebrow" style={{ color: "var(--text-accent)", marginBottom: 6 }}>
          Adjust my plan
        </p>
        <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.15, marginBottom: 8 }}>
          Where are you, really?
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 24 }}>
          Read ahead in a paper Bible, or fell behind? Set your actual spot and pace —
          the plan re-draws from here. Your streak and everything you&apos;ve already
          logged stay put.
        </p>

        {/* ── Where you are ── */}
        <div className="bh-card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="bh-eyebrow" style={{ color: "var(--text-muted)", display: "block", marginBottom: 12 }}>
            I&apos;m currently on
          </label>
          <div className="flex gap-2">
            <select
              className="bh-input"
              style={{ flex: 1, minWidth: 0 }}
              value={book}
              onChange={(e) => { setBook(e.target.value); setSaved(false); }}
              aria-label="Book"
            >
              {BIBLE_BOOKS.map((b) => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
            {/* Every chapter in the book — 1..N, no sparse presets */}
            <select
              className="bh-input"
              style={{ width: 116, flexShrink: 0 }}
              value={chapter}
              onChange={(e) => { setChapter(Number(e.target.value)); setSaved(false); }}
              aria-label="Chapter"
            >
              {Array.from({ length: chaptersInBook }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>Ch. {c}</option>
              ))}
            </select>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 10 }}>
            {book} has {chaptersInBook} chapter{chaptersInBook === 1 ? "" : "s"}.
          </p>
        </div>

        {/* ── Pace ── */}
        <div className="bh-card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="bh-eyebrow" style={{ color: "var(--text-muted)", display: "block", marginBottom: 12 }}>
            I want to read about
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {PACE_CHOICES.map((m) => {
              const active = !customOpen && m === minutes;
              const ch = chaptersForMinutes(m);
              return (
                <button
                  key={m}
                  onClick={() => { setCustomOpen(false); setMinutes(m); setSaved(false); }}
                  style={{
                    padding: "12px 6px",
                    borderRadius: 12,
                    border: `1.5px solid ${active ? "var(--gold-500)" : "var(--line-strong)"}`,
                    background: active ? "var(--gold-100)" : "var(--surface-card)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 180ms var(--ease-bh), background 180ms var(--ease-bh)",
                  }}
                >
                  <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: active ? "var(--gold-700)" : "var(--text-body)" }}>
                    {m} min
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: active ? "var(--gold-700)" : "var(--text-muted)", marginTop: 2 }}>
                    {ch} ch{ch === 1 ? "" : "s"}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => { setCustomOpen(true); setSaved(false); }}
              style={{
                padding: "12px 6px",
                borderRadius: 12,
                border: `1.5px solid ${customOpen ? "var(--gold-500)" : "var(--line-strong)"}`,
                background: customOpen ? "var(--gold-100)" : "var(--surface-card)",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: customOpen ? "var(--gold-700)" : "var(--text-body)" }}>
                Custom
              </span>
              <span style={{ display: "block", fontSize: 11.5, color: customOpen ? "var(--gold-700)" : "var(--text-muted)", marginTop: 2 }}>
                {customOpen ? `${minutes} min` : "pick"}
              </span>
            </button>
          </div>

          {customOpen && (
            <div className="bh-fade" style={{ marginTop: 12 }}>
              <select
                className="bh-input"
                value={minutes}
                onChange={(e) => { setMinutes(Number(e.target.value)); setSaved(false); }}
                aria-label="Minutes a day"
              >
                {CUSTOM_MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m} minute{m === 1 ? "" : "s"} a day · {chaptersForMinutes(m)} chapter{chaptersForMinutes(m) === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.5 }}>
            About {realMinutes} minutes a day at your current spot — chapter length varies
            by book, so this shifts as you move through.
          </p>
        </div>

        {/* ── How far ── */}
        <div className="bh-card" style={{ padding: 20, marginBottom: 16 }}>
          <label className="bh-eyebrow" style={{ color: "var(--text-muted)", display: "block", marginBottom: 12 }}>
            Read through
          </label>
          <select
            className="bh-input"
            value={endBook}
            onChange={(e) => { setEndBook(e.target.value); setSaved(false); }}
            aria-label="Final book"
          >
            {endBookOptions.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}{b.name === "Revelation" ? " (whole Bible)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* ── Live projection ── */}
        <div className="bh-sunk" style={{ padding: 20, marginBottom: 20 }}>
          <p className="bh-eyebrow" style={{ color: "var(--text-accent)", marginBottom: 14 }}>
            Your plan, updated
          </p>
          {[
            { l: "Starting from", v: `${book} ${chapter}` },
            { l: "Chapters left", v: `${remaining.toLocaleString("en-US")}` },
            { l: "At this pace", v: `${days.toLocaleString("en-US")} days` },
          ].map((row) => (
            <div key={row.l} className="flex items-baseline justify-between" style={{ marginBottom: 10, gap: 12 }}>
              <span style={{ fontSize: 14, color: "var(--text-secondary)", minWidth: 0 }}>{row.l}</span>
              <span style={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}>{row.v}</span>
            </div>
          ))}
          <div
            className="flex items-baseline justify-between"
            style={{
              gap: 12, marginTop: 14, paddingTop: 14,
              borderTop: "1px solid var(--line-hairline)",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-accent)" }}>You&apos;ll finish</span>
            <span className="bh-serif" style={{ fontSize: 18, fontWeight: 500, textAlign: "right" }}>
              {fmtMonthYear(finish)}
            </span>
          </div>
        </div>

        <button onClick={handleSave} className="bh-btn bh-btn-primary" disabled={saved}>
          {saved ? (<><Check className="h-4 w-4" /> Saved</>) : "Save my plan"}
        </button>

        {saved && (
          <div className="bh-fade" style={{ marginTop: 14, textAlign: "center" }}>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 12 }}>
              Today&apos;s reading now starts at {book} {chapter}.
            </p>
            <Link href="/today" className="bh-btn bh-btn-secondary">
              See today&apos;s reading
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
