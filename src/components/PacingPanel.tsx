"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  positionToChapterIndex,
  computePace,
  evaluatePaceStatus,
  reflowPlan,
  TOTAL_CHAPTERS,
  BIBLE_INDEX,
} from "@/lib/pacing";

const CARD = "#EFE7D6";
const INK = "#221C14";
const SOFT_INK = "#5A4F3F";
const GOLD = "#C9962E";
const SAGE = "#7A8B6F";

interface GoalRow {
  id: string;
  type: "destination" | "habit";
  target_date: string | null;
  daily_components: { label: string; description: string }[] | null;
  created_at: string;
}

interface PositionRow {
  book: string;
  chapter: number;
  recorded_at: string;
}

/**
 * Non-invasive pacing + bookshelf panel, styled to the parchment design
 * system. Renders nothing if the user has no active goal yet (new users
 * are routed through /welcome to create one).
 */
export default function PacingPanel() {
  const [goal, setGoal] = useState<GoalRow | null>(null);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }
      const [{ data: goals }, { data: pos }] = await Promise.all([
        supabase
          .from("goals")
          .select("id, type, target_date, daily_components, created_at")
          .eq("user_id", user.id)
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("reading_positions")
          .select("book, chapter, recorded_at")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: true }),
      ]);
      if (cancelled) return;
      setGoal((goals && goals[0]) || null);
      setPositions(pos || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !goal || positions.length === 0) return null;

  const latest = positions[positions.length - 1];
  const currentChapterIndex = positionToChapterIndex(latest.book, latest.chapter);
  const history = positions.map((p) => ({
    date: p.recorded_at,
    chapterIndex: positionToChapterIndex(p.book, p.chapter),
  }));
  const pace = computePace(history);
  const first = positions[0];
  const startIndex = positionToChapterIndex(first.book, first.chapter);

  const status = goal.target_date
    ? evaluatePaceStatus(
        currentChapterIndex,
        startIndex,
        new Date(first.recorded_at),
        pace.chaptersPerDay,
        new Date()
      )
    : null;

  const reflow =
    status?.label === "behind" && goal.target_date
      ? reflowPlan(currentChapterIndex, new Date(goal.target_date))
      : null;

  const booksReadCount = Math.floor(currentChapterIndex / (TOTAL_CHAPTERS / 66));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
      {status && (
        <div
          style={{
            background: CARD,
            borderRadius: 12,
            padding: "28px 32px",
            boxShadow: "0 6px 20px rgba(34,28,20,.08)",
            fontFamily: "-apple-system, sans-serif",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 600, color: INK }}>
            {status.label === "ahead" ? (
              <>
                You're <span style={{ color: SAGE }}>{status.daysAheadOrBehind} day
                {status.daysAheadOrBehind === 1 ? "" : "s"} ahead</span> of pace
              </>
            ) : (
              status.message
            )}
          </div>
          {reflow && (
            <div style={{ marginTop: 8, fontSize: 14, color: SOFT_INK }}>{reflow.message}</div>
          )}
        </div>
      )}

      {goal.type === "habit" && goal.daily_components && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {goal.daily_components.map((c) => (
            <div
              key={c.label}
              style={{
                borderRadius: 999,
                padding: "9px 16px",
                fontSize: 14,
                fontWeight: 600,
                background: CARD,
                color: SOFT_INK,
                border: `1px solid ${SOFT_INK}`,
              }}
            >
              {c.label}
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxWidth: 660 }}>
          {BIBLE_INDEX.map((b, i) => (
            <div
              key={b.name}
              title={b.name}
              style={{
                width: 9,
                height: 40,
                borderRadius: 2,
                background: i < booksReadCount ? GOLD : "transparent",
                border: i < booksReadCount ? "none" : `1px solid ${SOFT_INK}`,
              }}
            />
          ))}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: SOFT_INK,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {booksReadCount} of 66 books read
        </div>
      </div>
    </div>
  );
}
