"use client";
import { useState, useEffect, useMemo } from "react";
import NavBar from "@/components/NavBar";
import { supabase } from "@/lib/supabase";
import {
  getPlan,
  getProgress,
  getCurrentStreak,
  getLongestStreak,
  getTotalChaptersRead,
  formatDate,
  syncProgress,
} from "@/lib/reading-store";
import { getHighlights, removeHighlight, type Highlight } from "@/lib/highlights-store";
import { getAllNotes, type ChapterNote } from "@/lib/notes-store";

const SunriseIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" />
    <path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 6 4-4 4 4" />
    <path d="M16 18a4 4 0 0 0-8 0" />
  </svg>
);

const MILESTONES = [
  { n: 7, label: "First week" },
  { n: 30, label: "A month" },
  { n: 100, label: "A hundred" },
  { n: 365, label: "A year" },
];

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [totalRead, setTotalRead] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<ChapterNote[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setStreak(getCurrentStreak());
    setLongest(getLongestStreak());
    setTotalRead(getTotalChaptersRead());
    setHighlights(getHighlights());
    setNotes(getAllNotes());
    setLoading(false);

    supabase.auth.getSession().then(async ({ data }) => {
      const loggedIn = !!data.session?.user;
      setIsSignedIn(loggedIn);
      if (loggedIn) {
        await syncProgress();
        setStreak(getCurrentStreak());
        setLongest(getLongestStreak());
        setTotalRead(getTotalChaptersRead());
        setRefreshKey((k) => k + 1);
      }
    });
  }, []);

  // ─── Heat map: 16 weeks × 7 days, ending this week ───────────
  const heat = useMemo(() => {
    const progress = getProgress();
    const plan = getPlan();
    const pace = plan?.chaptersPerDay ?? 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // End the grid on the Saturday of the current week
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const weeks: { date: Date; level: 0 | 1 | 2; future: boolean; isToday: boolean }[][] = [];
    for (let w = 15; w >= 0; w--) {
      const col: { date: Date; level: 0 | 1 | 2; future: boolean; isToday: boolean }[] = [];
      for (let d = 6; d >= 0; d--) {
        const cell = new Date(end);
        cell.setDate(cell.getDate() - (w * 7 + d));
        const key = formatDate(cell);
        const count = progress[key]?.length ?? 0;
        const level: 0 | 1 | 2 = count === 0 ? 0 : count >= pace ? 2 : 1;
        col.push({
          date: cell,
          level,
          future: cell.getTime() > today.getTime(),
          isToday: cell.getTime() === today.getTime(),
        });
      }
      weeks.push(col);
    }
    const firstDate = weeks[0][0].date;
    const startMonth = firstDate.toLocaleDateString("en-US", { month: "long" });
    return { weeks, startMonth };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalRead, refreshKey]);

  const sinceLabel = useMemo(() => {
    const progress = getProgress();
    const dates = Object.keys(progress).filter((d) => progress[d].length > 0).sort();
    if (dates.length === 0) return null;
    const first = new Date(dates[0] + "T00:00:00");
    return first.toLocaleDateString("en-US", { month: "long" });
  }, [refreshKey]);

  const bestStreak = Math.max(streak, longest);
  const nextMilestone = MILESTONES.find((m) => bestStreak < m.n) ?? null;

  if (loading) {
    return (
      <div className="bh-app">
        <NavBar />
        <div className="flex items-center justify-center py-32" style={{ color: "var(--text-muted)" }}>Loading…</div>
      </div>
    );
  }

  const hasAnyReading = totalRead > 0;

  return (
    <div className="bh-app">
      <NavBar />
      <div className="max-w-2xl mx-auto" style={{ padding: "20px 20px 28px" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          {sinceLabel && (
            <p className="bh-eyebrow" style={{ color: "var(--text-accent)", marginBottom: 4 }}>Since {sinceLabel}</p>
          )}
          <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2 }}>
            {streak === 0
              ? hasAnyReading ? "Ready when you are" : "Your first morning awaits"
              : streak === 1 ? "Read this morning" : `${streak} mornings in a row`}
          </h1>
        </div>

        <div className="space-y-4">

          {/* Heat map */}
          <div className="bh-card" style={{ padding: 20, overflowX: "auto" }}>
            <div className="flex gap-1" style={{ minWidth: 252 }}>
              {heat.weeks.map((col, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {col.map((cell, di) => (
                    <div
                      key={di}
                      title={`${cell.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: cell.future
                          ? "transparent"
                          : cell.level === 2 ? "var(--gold-500)" : cell.level === 1 ? "var(--gold-200)" : "var(--cream-200)",
                        outline: cell.isToday ? "1.5px solid var(--gold-700)" : "none",
                        outlineOffset: 1,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{heat.startMonth}</span>
              <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--cream-200)" }} />
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--gold-200)" }} />
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--gold-500)" }} />
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Today</span>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bh-card text-center" style={{ padding: "20px 16px" }}>
              <p className="bh-serif" style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.15 }}>{totalRead}</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>chapters read</p>
            </div>
            <div className="bh-card text-center" style={{ padding: "20px 16px" }}>
              <p className="bh-serif" style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.15 }}>{streak}</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>mornings in a row</p>
            </div>
          </div>

          {/* Milestones — rings, not badges */}
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Milestones</p>
            <div className="grid grid-cols-4 gap-3">
              {MILESTONES.map((m) => {
                const achieved = bestStreak >= m.n;
                return (
                  <div key={m.n} className="bh-card flex flex-col items-center text-center" style={{ padding: "14px 6px" }}>
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 999,
                        border: `2px solid ${achieved ? "var(--gold-500)" : "var(--line-strong)"}`,
                        background: achieved ? "var(--gold-100)" : "transparent",
                      }}
                    >
                      <span className="bh-serif" style={{ fontSize: 16, fontWeight: 500, color: achieved ? "var(--gold-700)" : "var(--text-muted)" }}>
                        {m.n}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: achieved ? "var(--text-secondary)" : "var(--text-muted)", marginTop: 6, lineHeight: 1.2 }}>{m.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next milestone */}
          {nextMilestone && (
            <div className="flex items-center gap-3" style={{ background: "var(--gold-100)", borderRadius: 14, padding: "16px 20px" }}>
              <span style={{ color: "var(--gold-700)" }}><SunriseIcon size={20} /></span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gold-700)" }}>
                  {nextMilestone.n} mornings — {nextMilestone.n - bestStreak} to go
                </p>
                <p style={{ fontSize: 13, color: "var(--gold-700)", opacity: 0.8, marginTop: 2 }}>
                  No hurry. It arrives when it arrives.
                </p>
              </div>
            </div>
          )}

          {/* Sign-in nudge */}
          {isSignedIn === false && hasAnyReading && (
            <div className="bh-card flex items-center justify-between gap-3" style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Kept on this device — sign in and it follows you.</p>
              <a href="/login?mode=signin" className="bh-btn bh-btn-secondary flex-shrink-0" style={{ width: "auto", height: 40, padding: "0 18px", fontSize: 13 }}>
                Sign in
              </a>
            </div>
          )}

          {/* Kept verses */}
          {highlights.length > 0 && (
            <div className="bh-card" style={{ padding: 20 }}>
              <div className="flex items-baseline justify-between" style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>Kept verses</p>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{highlights.length}</span>
              </div>
              <div className="space-y-3">
                {highlights.slice(0, 5).map((h) => (
                  <div key={h.id} style={{ background: "var(--gold-100)", borderLeft: "3px solid var(--gold-400)", borderRadius: "0 10px 10px 0", padding: "12px 14px" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gold-700)", marginBottom: 4 }}>
                      {h.book} {h.chapter}:{h.verses.join(",")}
                    </p>
                    <p className="bh-serif line-clamp-3" style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-body)" }}>{h.text}</p>
                    <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(h.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <button
                        onClick={() => { removeHighlight(h.id); setHighlights(getHighlights()); }}
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {highlights.length > 5 && (
                  <p className="text-center" style={{ fontSize: 12, color: "var(--text-muted)" }}>and {highlights.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {notes.length > 0 && (
            <div className="bh-card" style={{ padding: 20 }}>
              <div className="flex items-baseline justify-between" style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>My notes</p>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{notes.length}</span>
              </div>
              <div className="space-y-3">
                {notes.slice(0, 5).map((n) => (
                  <div key={`${n.book}${n.chapter}`} className="bh-sunk" style={{ padding: "12px 14px" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-accent)", marginBottom: 4 }}>
                      {n.book} {n.chapter}
                    </p>
                    <p className="line-clamp-3" style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{n.text}</p>
                  </div>
                ))}
                {notes.length > 5 && (
                  <p className="text-center" style={{ fontSize: 12, color: "var(--text-muted)" }}>and {notes.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasAnyReading && (
            <div className="bh-sunk text-center" style={{ padding: "28px 20px" }}>
              <p className="bh-serif" style={{ fontSize: 19, fontWeight: 500 }}>The map fills in as you read</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, marginBottom: 16 }}>
                One square a morning. Start with today&apos;s.
              </p>
              <a href="/today" className="bh-btn bh-btn-primary mx-auto" style={{ maxWidth: 280 }}>
                Open today&apos;s reading
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
