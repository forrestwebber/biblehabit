"use client";
import { useState, useEffect, useCallback } from "react";
import { queuePush } from "@/lib/cloud-state";
import NavBar from "@/components/NavBar";
import BibleAffiliate from "@/components/BibleAffiliate";
import SignUpGate from "@/components/SignUpGate";
import TrialBanner from "@/components/TrialBanner";
import { useEntitlement } from "@/lib/use-entitlement";
import { supabase } from "@/lib/supabase";
import {
  BIBLE_BOOKS,
  TOTAL_CHAPTERS,
  getGlobalChapterIndex,
  getBookAndChapter,
  getChaptersInPlan,
  getPlanEndGlobal,
} from "@/lib/bible-data";
import {
  getPlan,
  markDayComplete,
  unmarkDayComplete,
  isDayComplete,
  getCurrentStreak,
  getTotalChaptersRead,
  getProgress,
  formatDate,
  syncProgress,
} from "@/lib/reading-store";
import {
  getSubPlans,
  getSubPlanChapterToday,
  markSubPlanDone,
  isSubPlanDoneToday,
  getSubPlanStreak,
  removeSubPlan,
  addSubPlan,
  DEVOTIONAL_PRESETS,
  type SubPlan,
} from "@/lib/sub-plans";
import { addXP, XP_PER_CHAPTER } from "@/lib/xp-store";
import { saveHighlight } from "@/lib/highlights-store";
import { getNote, saveNote } from "@/lib/notes-store";
import { hapticTap, hapticMedium, hapticSuccess } from "@/lib/haptics";
import { estimateChapterMinutes } from "@/lib/reading-time";
import { verseShareUrl, formatVerseQuoteBlocks } from "@/lib/verse-link";

// ─── Translations ────────────────────────────────────────────────
const TRANSLATIONS = [
  { id: "kjv", label: "KJV", name: "King James", api: "bible-api" },
  { id: "niv", label: "NIV", name: "New International", api: "bolls" },
  { id: "esv", label: "ESV", name: "English Standard", api: "bolls" },
  { id: "nkjv", label: "NKJV", name: "New King James", api: "bolls" },
  { id: "nlt", label: "NLT", name: "New Living", api: "bolls" },
  { id: "web", label: "WEB", name: "World English", api: "bible-api" },
  { id: "asv", label: "ASV", name: "American Standard", api: "bible-api" },
  { id: "bbe", label: "BBE", name: "Basic English", api: "bible-api" },
];
const DEFAULT_TRANSLATION = "kjv";
const TRANSLATION_STORAGE_KEY = "biblehabit_translation";

const BOOK_NUMBER: Record<string, number> = {
  "Genesis":1,"Exodus":2,"Leviticus":3,"Numbers":4,"Deuteronomy":5,"Joshua":6,
  "Judges":7,"Ruth":8,"1 Samuel":9,"2 Samuel":10,"1 Kings":11,"2 Kings":12,
  "1 Chronicles":13,"2 Chronicles":14,"Ezra":15,"Nehemiah":16,"Esther":17,
  "Job":18,"Psalms":19,"Proverbs":20,"Ecclesiastes":21,"Song of Solomon":22,
  "Isaiah":23,"Jeremiah":24,"Lamentations":25,"Ezekiel":26,"Daniel":27,
  "Hosea":28,"Joel":29,"Amos":30,"Obadiah":31,"Jonah":32,"Micah":33,
  "Nahum":34,"Habakkuk":35,"Zephaniah":36,"Haggai":37,"Zechariah":38,"Malachi":39,
  "Matthew":40,"Mark":41,"Luke":42,"John":43,"Acts":44,"Romans":45,
  "1 Corinthians":46,"2 Corinthians":47,"Galatians":48,"Ephesians":49,
  "Philippians":50,"Colossians":51,"1 Thessalonians":52,"2 Thessalonians":53,
  "1 Timothy":54,"2 Timothy":55,"Titus":56,"Philemon":57,"Hebrews":58,
  "James":59,"1 Peter":60,"2 Peter":61,"1 John":62,"2 John":63,
  "3 John":64,"Jude":65,"Revelation":66,
};

function getSavedTranslation(): string {
  if (typeof window === "undefined") return DEFAULT_TRANSLATION;
  return localStorage.getItem(TRANSLATION_STORAGE_KEY) ?? DEFAULT_TRANSLATION;
}

async function fetchChapterText(
  book: string,
  chapter: number,
  translation = DEFAULT_TRANSLATION
): Promise<{ verses: { verse: number; text: string }[] } | null> {
  try {
    const tConfig = TRANSLATIONS.find(t => t.id === translation);
    const api = tConfig?.api ?? "bible-api";

    if (api === "bolls") {
      const bookNum = BOOK_NUMBER[book];
      if (!bookNum) return null;
      const res = await fetch(
        `https://bolls.life/get-chapter/${translation.toUpperCase()}/${bookNum}/${chapter}/`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return null;
      return {
        verses: data.map((v: { verse: number; text: string }) => ({
          verse: v.verse,
          text: v.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        })),
      };
    }

    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${translation}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.verses) {
      return {
        verses: data.verses.map((v: { verse: number; text: string }) => ({
          verse: v.verse,
          text: v.text.trim(),
        })),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function greetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Role-account local parts are not names — hello@, info@ and friends produced
// "Good evening, Hello" on the Today screen (Forrest, 2026-08-02). Fall back to
// no name rather than greeting someone by their mailbox.
const NON_NAME_LOCALS = new Set([
  "hello", "hi", "info", "admin", "contact", "support", "team", "me", "mail",
  "email", "no-reply", "noreply", "office", "help", "sales", "billing", "user",
]);

function displayFirstName(fullName?: unknown, name?: unknown, email?: string): string {
  const explicit = (typeof fullName === "string" && fullName) || (typeof name === "string" && name) || "";
  const first = explicit.trim().split(/\s+/)[0] ?? "";
  if (first) return first;
  const local = email?.split("@")[0]?.trim() ?? "";
  // Only accept a mailbox as a name if it looks like one (letters, no digits/dots)
  // …and only when it's short enough to be a first name, not "forrestwebber".
  if (!local || NON_NAME_LOCALS.has(local.toLowerCase()) || !/^[a-z]{2,12}$/i.test(local)) return "";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

const SunriseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" />
    <path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 6 4-4 4 4" />
    <path d="M16 18a4 4 0 0 0-8 0" />
  </svg>
);

const ChevronRightIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

const CheckIcon = ({ size = 18, stroke = 2 }: { size?: number; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);

// ─── Main component ──────────────────────────────────────────────
export default function TodayPage() {
  // Entitlement decides what the habit layer does. Scripture is never gated:
  // the reading, its text, translations and verse sharing stay open forever.
  // `pro` gates customization and extras only. The daily habit — today's
  // reading, marking it done, the streak — is free forever, so nothing on the
  // core path is allowed to depend on this. See lib/entitlement.ts.
  const { ent, pro, refresh: refreshEntitlement } = useEntitlement();

  const [plan, setPlanState] = useState<ReturnType<typeof getPlan>>(null);
  const [loading, setLoading] = useState(true);
  const [translation, setTranslation] = useState<string>(DEFAULT_TRANSLATION);
  const [chapterTexts, setChapterTexts] = useState<
    Map<string, { verses: { verse: number; text: string }[] }>
  >(new Map());
  const [currentChapterView, setCurrentChapterView] = useState(0);
  const [todayDone, setTodayDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalRead, setTotalRead] = useState(0);
  const [showSignUpGate, setShowSignUpGate] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const [readingOpen, setReadingOpen] = useState(false);

  // Sub-plans (Psalm, Proverb, etc.)
  const [subPlans, setSubPlans] = useState<SubPlan[]>([]);
  const [subPlanDone, setSubPlanDone] = useState<Set<string>>(new Set());
  const [showDevotionalPicker, setShowDevotionalPicker] = useState(false);

  // Reading preferences
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === "undefined") return 19;
    return parseInt(localStorage.getItem("bh-font-size") ?? "19", 10);
  });

  const changeFontSize = (delta: number) => {
    setFontSize(prev => {
      const next = Math.max(15, Math.min(24, prev + delta));
      localStorage.setItem("bh-font-size", String(next));
      queuePush("bh-font-size");
      return next;
    });
  };

  // Verse selection / sharing / highlights
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [highlightSaved, setHighlightSaved] = useState(false);

  // Chapter notes
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const refreshStats = useCallback(() => {
    setPlanState(getPlan());
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setTodayDone(isDayComplete(formatDate(new Date())));
  }, []);

  const refreshSubPlans = useCallback(() => {
    const plans = getSubPlans();
    setSubPlans(plans.filter((p) => !p.paused));
    const doneSet = new Set<string>();
    for (const p of plans) {
      if (!p.paused && isSubPlanDoneToday(p.id)) doneSet.add(p.id);
    }
    setSubPlanDone(doneSet);
  }, []);

  // Calculate today's reading
  const getTodayInfo = useCallback(
    (planData = plan) => {
      if (!planData) return null;
      const planEndGlobal = getPlanEndGlobal(planData.endBook);
      const startDate = new Date(planData.startDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / 86400000
      );
      const dayNumber = Math.max(0, daysSinceStart);

      const globalStart =
        getGlobalChapterIndex(planData.startBook, planData.startChapter) +
        dayNumber * planData.chaptersPerDay;

      if (globalStart > planEndGlobal) return null;

      const globalEnd = Math.min(
        globalStart + planData.chaptersPerDay - 1,
        planEndGlobal
      );

      const chapters: { book: string; chapter: number; globalIndex: number }[] = [];
      for (let i = globalStart; i <= globalEnd; i++) {
        const bc = getBookAndChapter(i);
        chapters.push({ book: bc.book, chapter: bc.chapter, globalIndex: i });
      }

      const totalChapters = getChaptersInPlan(planData.startBook, planData.startChapter, planData.endBook);
      const totalDays = Math.ceil(totalChapters / planData.chaptersPerDay);

      return { dayNumber: dayNumber + 1, totalDays, chapters, globalStart, globalEnd };
    },
    [plan]
  );

  // Tomorrow preview
  const getTomorrowPreview = useCallback(
    (planData = plan) => {
      if (!planData) return null;
      const startDate = new Date(planData.startDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor(
        (today.getTime() - startDate.getTime()) / 86400000
      );
      const tomorrowDay = Math.max(0, daysSinceStart) + 1;
      const globalStart =
        getGlobalChapterIndex(planData.startBook, planData.startChapter) +
        tomorrowDay * planData.chaptersPerDay;
      if (globalStart >= TOTAL_CHAPTERS) return null;
      const globalEnd = Math.min(globalStart + planData.chaptersPerDay - 1, TOTAL_CHAPTERS - 1);
      const chapters: { book: string; chapter: number }[] = [];
      for (let i = globalStart; i <= globalEnd && i < TOTAL_CHAPTERS; i++) {
        const bc = getBookAndChapter(i);
        chapters.push({ book: bc.book, chapter: bc.chapter });
      }
      if (!chapters.length) return null;
      const first = chapters[0];
      const last = chapters[chapters.length - 1];
      const label =
        first.book === last.book
          ? `${first.book} ${first.chapter}${first.chapter !== last.chapter ? `–${last.chapter}` : ""}`
          : `${first.book} ${first.chapter} – ${last.book} ${last.chapter}`;
      return { label, count: chapters.length };
    },
    [plan]
  );

  useEffect(() => {
    setTranslation(getSavedTranslation());
    setPlanState(getPlan());
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
    setTodayDone(isDayComplete(formatDate(new Date())));
    setLoading(false);
    refreshSubPlans();
    setIsNative(
      typeof (window as any).Capacitor !== "undefined" &&
      !!(window as any).Capacitor.isNativePlatform?.()
    );

    supabase.auth.getSession().then(async ({ data }) => {
      const loggedIn = !!data.session?.user;
      setIsSignedIn(loggedIn);
      if (loggedIn) {
        const u = data.session!.user;
        setFirstName(displayFirstName(u.user_metadata?.full_name, u.user_metadata?.name, u.email));
        await syncProgress();
        refreshStats();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = !!session?.user;
      setIsSignedIn(loggedIn);
      if (!loggedIn) return;
      // syncProgress() calls supabase.auth.getUser(). Calling any auth method
      // from inside this callback deadlocks supabase-js (it holds the auth lock
      // while the callback runs), which silently killed cloud sync on this
      // screen. Defer it off the callback stack.
      setTimeout(() => {
        syncProgress().then(refreshStats).catch(() => {});
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [refreshStats, refreshSubPlans]);

  const todayInfo = getTodayInfo();
  const tomorrowPreview = getTomorrowPreview();

  const planTotalChapters = plan
    ? getChaptersInPlan(plan.startBook, plan.startChapter, plan.endBook)
    : 1;

  // Average chapters per active day — powers "you read about N chapters a morning"
  const avgChaptersPerDay = (() => {
    const progress = getProgress();
    const days = Object.keys(progress).filter((k) => progress[k].length > 0).length;
    if (days === 0) return null;
    return totalRead / days;
  })();

  // Fetch chapter text for today's reading
  useEffect(() => {
    if (!todayInfo || todayInfo.chapters.length === 0) return;
    const ch = todayInfo.chapters[currentChapterView] ?? todayInfo.chapters[0];
    if (!ch) return;
    const key = `${translation}-${ch.book}-${ch.chapter}`;
    if (chapterTexts.has(key)) return;
    fetchChapterText(ch.book, ch.chapter, translation).then((data) => {
      if (data) setChapterTexts((prev) => new Map(prev).set(key, data));
    });
  }, [todayInfo, currentChapterView, chapterTexts, translation]);

  // Load note for the current chapter
  useEffect(() => {
    if (!todayInfo) return;
    const ch = todayInfo.chapters[currentChapterView];
    if (!ch) return;
    const saved = getNote(ch.book, ch.chapter);
    setNoteText(saved?.text ?? "");
    setNoteSaved(false);
  }, [todayInfo, currentChapterView]);

  function handleTranslationChange(id: string) {
    setTranslation(id);
    localStorage.setItem(TRANSLATION_STORAGE_KEY, id);
    queuePush(TRANSLATION_STORAGE_KEY);
  }

  const handleMarkDone = () => {
    if (!todayInfo) return;
    // No tier check: marking the day done IS the free product.
    hapticSuccess();
    const todayStr = formatDate(new Date());
    const indices = todayInfo.chapters.map((c) => c.globalIndex);
    markDayComplete(todayStr, indices);
    setTodayDone(true);
    setReadingOpen(false);
    const newStreak = getCurrentStreak();
    setStreak(newStreak);
    setTotalRead(getTotalChaptersRead());
    addXP(todayInfo.chapters.length * XP_PER_CHAPTER);

    if (isSignedIn === false) {
      if (todayInfo.dayNumber >= 3 || newStreak >= 3) setShowSignUpGate(true);
    }
  };

  const handleUndo = () => {
    unmarkDayComplete(formatDate(new Date()));
    setTodayDone(false);
    setStreak(getCurrentStreak());
    setTotalRead(getTotalChaptersRead());
  };

  const handleSubPlanDone = (planId: string) => {
    if (!pro) return; // side plans are a Pro feature
    hapticTap();
    markSubPlanDone(planId);
    setSubPlanDone((prev) => new Set([...prev, planId]));
  };

  // ─── Estimated minutes ────────────────────────────────────────
  const estimateMinutes = (chapters: { book: string; chapter: number }[]) => {
    let words = 0;
    let loaded = 0;
    for (const ch of chapters) {
      const data = chapterTexts.get(`${translation}-${ch.book}-${ch.chapter}`);
      if (data) {
        loaded++;
        words += data.verses.reduce((sum, v) => sum + v.text.split(/\s+/).length, 0);
      }
    }
    if (loaded === 0)
      return Math.max(1, Math.round(chapters.reduce((sum, ch) => sum + estimateChapterMinutes(ch.book), 0)));
    const perChapter = words / loaded / 238;
    return Math.max(1, Math.round(perChapter * chapters.length));
  };

  // ─── Loading / no plan states ─────────────────────────────────
  if (loading) {
    return (
      <div className="bh-app">
        <NavBar />
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid var(--gold-500)", borderTopColor: "transparent" }} />
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bh-app">
        <NavBar />
        <div className="max-w-lg mx-auto" style={{ padding: "56px 20px" }}>
          <div className="text-center" style={{ marginBottom: 32 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark.svg" alt="" width={52} height={52} className="mx-auto" style={{ marginBottom: 20 }} />
            <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2, marginBottom: 10 }}>Let&apos;s find your place</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
              A short set of questions, and tomorrow&apos;s reading will be waiting.
            </p>
            {/* Free tier goes straight into the one plan they have; Pro picks.
                A free reader must never be sent to a chooser whose options all
                cost money — that is a dead end dressed up as onboarding. */}
            {pro ? (
              <a href="/dashboard" className="bh-btn bh-btn-primary" style={{ maxWidth: 320, margin: "0 auto" }}>
                Choose a plan
              </a>
            ) : (
              <a href="/plans?start=free" className="bh-btn bh-btn-primary" style={{ maxWidth: 320, margin: "0 auto" }}>
                Start Bible in a Year
              </a>
            )}
          </div>

          {subPlans.length > 0 && pro && (
            <div className="space-y-3">
              <p className="bh-eyebrow" style={{ color: "var(--text-accent)", marginBottom: 8 }}>Daily readings</p>
              {subPlans.map((sp) => {
                const todayChapter = getSubPlanChapterToday(sp);
                const isDone = subPlanDone.has(sp.id);
                return (
                  <div key={sp.id} className="bh-card flex items-center justify-between" style={{ padding: 16 }}>
                    <div>
                      <p className="bh-eyebrow" style={{ color: "var(--text-accent)" }}>{sp.label}</p>
                      <p className="bh-serif" style={{ fontSize: 19, fontWeight: 500 }}>{sp.book} {todayChapter}</p>
                    </div>
                    {isDone ? (
                      <span className="flex items-center gap-1" style={{ color: "var(--sage-700)", fontSize: 14, fontWeight: 600 }}><CheckIcon size={16} /> Read</span>
                    ) : (
                      <button onClick={() => handleSubPlanDone(sp.id)} className="bh-btn bh-btn-secondary" style={{ width: "auto", height: 40, padding: "0 18px", fontSize: 14 }}>Mark read</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!todayInfo || todayInfo.chapters.length === 0) {
    return (
      <div className="bh-app">
        <NavBar />
        <div className="text-center max-w-lg mx-auto" style={{ padding: "96px 20px" }}>
          <div className="mx-auto flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 999, background: "var(--sage-500)", color: "#fff", marginBottom: 20 }}>
            <CheckIcon size={22} />
          </div>
          <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, marginBottom: 10 }}>You&apos;ve finished</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28 }}>
            Every chapter of your plan, read. Whatever comes next is already an open door.
          </p>
          <a href="/dashboard" className="bh-btn bh-btn-primary" style={{ maxWidth: 320, margin: "0 auto" }}>
            Choose what&apos;s next
          </a>
        </div>
      </div>
    );
  }

  // ─── Render helpers ───────────────────────────────────────────
  const currentCh = todayInfo.chapters[currentChapterView];
  const chapterKey = currentCh ? `${translation}-${currentCh.book}-${currentCh.chapter}` : "";
  const chapterData = chapterTexts.get(chapterKey);
  const translationInfo = TRANSLATIONS.find((t) => t.id === translation);
  const translationLabel = translationInfo?.label ?? "KJV";

  const firstCh = todayInfo.chapters[0];
  const lastCh = todayInfo.chapters[todayInfo.chapters.length - 1];
  const headerLabel =
    firstCh.book === lastCh.book
      ? `${firstCh.book} ${firstCh.chapter}${
          firstCh.chapter !== lastCh.chapter ? `–${lastCh.chapter}` : ""
        }`
      : `${firstCh.book} ${firstCh.chapter} – ${lastCh.book} ${lastCh.chapter}`;

  const estMins = estimateMinutes(todayInfo.chapters);
  const firstChapterData = chapterTexts.get(`${translation}-${firstCh.book}-${firstCh.chapter}`);
  const previewVerse = firstChapterData?.verses?.[0]?.text ?? null;

  const planLabel = !plan.endBook || plan.endBook === "Revelation"
    ? (plan.startBook === "Genesis" ? "Whole Bible" : `${plan.startBook} to Revelation`)
    : plan.startBook === plan.endBook
      ? plan.startBook
      : `${plan.startBook} to ${plan.endBook}`;

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const translationFootnote = translation === "kjv" ? "King James Version, public domain" : `${translationInfo?.name ?? translationLabel} translation`;

  return (
    <div className="bh-app">
      <NavBar />

      {showSignUpGate && (
        <SignUpGate streak={streak} onDismiss={() => setShowSignUpGate(false)} />
      )}

      <div className="max-w-2xl mx-auto" style={{ padding: "20px 20px 28px" }}>

        {/* One quiet line while the trial runs — dismissible, once a day. */}
        {ent?.status === "trialing" && (
          <TrialBanner daysLeft={ent.daysLeft} isNative={isNative} />
        )}

        {/* ─── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between" style={{ marginBottom: 20, gap: 12 }}>
          <div>
            <p className="bh-eyebrow" style={{ color: "var(--text-accent)", marginBottom: 4 }}>
              {greetingWord()}{firstName ? `, ${firstName}` : ""}
            </p>
            <h2 className="bh-serif" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.25 }}>{dateLabel}</h2>
          </div>
          {streak > 0 && (
            <span className="bh-chip" style={{ marginTop: 4 }}>
              <SunriseIcon size={16} /> {streak} in a row
            </span>
          )}
        </div>

        <div className="space-y-4">

          {/* ─── Reading card ───────────────────────────────────── */}
          {/* Every signed-in reader sees this, free tier included: the streak
              celebration is the habit loop, and charging for it would break the
              one thing the free product exists to do. */}
          {todayDone ? (
            /* Complete state — the tick simply appears. No confetti. */
            <div
              className="bh-fade relative overflow-hidden text-center"
              style={{
                borderRadius: 20,
                border: "1px solid var(--gold-200)",
                background: "linear-gradient(180deg, var(--gold-100) 0%, var(--cream-50) 62%)",
                padding: "32px 24px 24px",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: "50%", background: "radial-gradient(60% 100% at 50% 100%, rgba(201,150,46,.28), transparent 70%)" }} />
              <div className="relative">
                <div className="mx-auto flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 999, background: "var(--sage-500)", color: "#FFFDF7", marginBottom: 16 }}>
                  <CheckIcon size={22} />
                </div>
                <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2 }}>
                  {streak === 1 ? "Read this morning" : `${streak} mornings in a row`}
                </h1>
                <p className="bh-serif" style={{ fontStyle: "italic", fontSize: 22, lineHeight: 1.6, color: "var(--text-secondary)", marginTop: 10 }}>
                  Tomorrow is already set out.
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 14 }}>
                  {headerLabel} · {estMins} minutes · {translationFootnote}
                </p>
                <button onClick={handleUndo} className="bh-btn bh-btn-quiet mx-auto" style={{ width: "auto", padding: "0 20px", marginTop: 8 }}>
                  Undo
                </button>
              </div>
            </div>
          ) : !readingOpen ? (
            /* Ready state */
            <>
              <div className="relative overflow-hidden" style={{ borderRadius: 20, border: "1px solid var(--line-hairline)", background: "var(--surface-card)", boxShadow: "var(--shadow-card)", padding: 24 }}>
                <div className="bh-dawn pointer-events-none absolute inset-x-0 bottom-0" style={{ height: "55%" }} />
                <div className="relative">
                  <p className="bh-eyebrow" style={{ color: "var(--text-accent)", marginBottom: 8 }}>Today&apos;s reading</p>
                  <h2 className="bh-serif" style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.25 }}>{headerLabel}</h2>
                  {previewVerse && (
                    <p className="bh-serif" style={{ fontStyle: "italic", fontSize: 17, lineHeight: 1.7, color: "var(--text-secondary)", marginTop: 12 }}>
                      &ldquo;{previewVerse.length > 120 ? previewVerse.slice(0, 120).trimEnd() + "…" : previewVerse}&rdquo;
                    </p>
                  )}
                  <button onClick={() => { hapticTap(); setReadingOpen(true); }} className="bh-btn bh-btn-primary" style={{ marginTop: 18 }}>
                    Start reading
                  </button>
                  <p className="text-center" style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>
                    About {estMins} minutes
                  </p>
                </div>
              </div>
              <button onClick={handleMarkDone} className="bh-btn bh-btn-secondary">
                Mark complete
              </button>
            </>
          ) : (
            /* ─── Expanded reading view ─────────────────────────── */
            <div className="bh-card-hero overflow-hidden">
              <div className="flex items-center justify-between" style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-hairline)" }}>
                <button onClick={() => setReadingOpen(false)} className="flex items-center gap-1" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  Today
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeFontSize(-1)} style={{ width: 30, height: 30, borderRadius: 999, background: "var(--surface-sunk)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>A−</button>
                  <button onClick={() => changeFontSize(1)} style={{ width: 30, height: 30, borderRadius: 999, background: "var(--surface-sunk)", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>A+</button>
                </div>
              </div>

              {/* Translation pills */}
              <div className="flex items-center gap-1.5 flex-wrap" style={{ padding: "12px 20px 0" }}>
                {TRANSLATIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTranslationChange(t.id)}
                    title={t.name}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: translation === t.id ? "var(--gold-500)" : "var(--surface-sunk)",
                      color: translation === t.id ? "var(--text-on-accent)" : "var(--text-muted)",
                      transition: "background 200ms, color 200ms",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Chapter tabs */}
              {todayInfo.chapters.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto" style={{ padding: "10px 16px 0", borderBottom: "1px solid var(--line-hairline)" }}>
                  {todayInfo.chapters.map((ch, i) => (
                    <button
                      key={ch.globalIndex}
                      onClick={() => setCurrentChapterView(i)}
                      className="whitespace-nowrap"
                      style={{
                        padding: "8px 12px",
                        fontSize: 14,
                        fontWeight: i === currentChapterView ? 600 : 500,
                        color: i === currentChapterView ? "var(--gold-700)" : "var(--text-muted)",
                        borderBottom: i === currentChapterView ? "2px solid var(--gold-500)" : "2px solid transparent",
                      }}
                    >
                      {ch.book} {ch.chapter}
                    </button>
                  ))}
                </div>
              )}

              {/* Chapter text */}
              <div style={{ padding: "20px 20px 8px" }}>
                {currentCh && (
                  <div className="flex items-baseline justify-between" style={{ marginBottom: 12 }}>
                    <h2 className="bh-serif" style={{ fontSize: 19, fontWeight: 500 }}>
                      {currentCh.book} {currentCh.chapter}{" "}
                      <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>{translationLabel}</span>
                    </h2>
                    {selectedVerses.size > 0 && (
                      <button onClick={() => setSelectedVerses(new Set())} style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Clear selection
                      </button>
                    )}
                  </div>
                )}

                {chapterData ? (
                  <div className="bh-serif" style={{ color: "var(--text-body)", fontSize: `${fontSize}px`, lineHeight: 1.75, maxWidth: "34rem" }}>
                    {chapterData.verses.map((v) => {
                      const isSelected = selectedVerses.has(v.verse);
                      return (
                        <p
                          key={v.verse}
                          onClick={() => {
                            hapticTap();
                            setSelectedVerses((prev) => {
                              const next = new Set(prev);
                              if (next.has(v.verse)) next.delete(v.verse);
                              else next.add(v.verse);
                              return next;
                            });
                            setHighlightSaved(false);
                          }}
                          className="cursor-pointer select-none"
                          style={{
                            padding: "4px 8px",
                            borderRadius: 8,
                            transition: "background 200ms",
                            background: isSelected ? "var(--gold-100)" : "transparent",
                            borderLeft: isSelected ? "3px solid var(--gold-500)" : "3px solid transparent",
                          }}
                        >
                          <sup style={{ marginRight: 6, fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, color: "var(--gold-600)" }}>
                            {v.verse}
                          </sup>
                          {v.text}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse"
                        style={{ height: 14, borderRadius: 6, background: "var(--surface-sunk)", width: `${70 + (i * 7) % 30}%` }}
                      />
                    ))}
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>Setting out the chapter…</p>
                  </div>
                )}
              </div>

              {/* Navigation between chapters */}
              {todayInfo.chapters.length > 1 && (
                <div className="flex items-center justify-between" style={{ padding: "8px 20px" }}>
                  <button
                    onClick={() => setCurrentChapterView(Math.max(0, currentChapterView - 1))}
                    disabled={currentChapterView === 0}
                    className="flex items-center gap-1 disabled:opacity-30"
                    style={{ fontSize: 14, color: "var(--text-secondary)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg> Previous
                  </button>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {currentChapterView + 1} of {todayInfo.chapters.length}
                  </span>
                  <button
                    onClick={() => setCurrentChapterView(Math.min(todayInfo.chapters.length - 1, currentChapterView + 1))}
                    disabled={currentChapterView === todayInfo.chapters.length - 1}
                    className="flex items-center gap-1 disabled:opacity-30"
                    style={{ fontSize: 14, color: "var(--text-secondary)" }}
                  >
                    Next <ChevronRightIcon size={16} />
                  </button>
                </div>
              )}

              {/* Chapter notes — a Pro feature */}
              {pro && (
              <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line-hairline)" }}>
                <p className="bh-eyebrow" style={{ color: "var(--text-muted)", marginBottom: 8 }}>My notes</p>
                <textarea
                  value={noteText}
                  onChange={(e) => { setNoteText(e.target.value); setNoteSaved(false); }}
                  placeholder="A reflection, a prayer, a thought worth keeping…"
                  rows={3}
                  style={{
                    width: "100%",
                    background: "var(--surface-sunk)",
                    color: "var(--text-body)",
                    border: "1px solid var(--line-hairline)",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    lineHeight: 1.6,
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "var(--sans)",
                  }}
                />
                {noteText.trim() && (
                  <button
                    onClick={() => {
                      if (!todayInfo) return;
                      const ch = todayInfo.chapters[currentChapterView];
                      if (!ch) return;
                      hapticMedium();
                      saveNote(ch.book, ch.chapter, noteText);
                      setNoteSaved(true);
                      setTimeout(() => setNoteSaved(false), 2000);
                    }}
                    className="bh-btn"
                    style={{
                      width: "auto",
                      height: 36,
                      padding: "0 18px",
                      fontSize: 13,
                      marginTop: 8,
                      background: noteSaved ? "var(--sage-500)" : "var(--gold-500)",
                      color: "var(--text-on-accent)",
                      border: "none",
                    }}
                  >
                    {noteSaved ? "Kept" : "Keep note"}
                  </button>
                )}
              </div>
              )}

              {/* Mark complete — free forever */}
              <div style={{ padding: "16px 20px 20px", borderTop: "1px solid var(--line-hairline)" }}>
                <button onClick={handleMarkDone} className="bh-btn bh-btn-primary">
                  Mark complete
                </button>
              </div>
            </div>
          )}

          {/* ─── Daily readings (sub-plans) — Plus ─────────────── */}
          {subPlans.length > 0 && !readingOpen && pro && (
            <div className="space-y-3">
              <p className="bh-eyebrow" style={{ color: "var(--text-accent)" }}>Also today</p>
              {subPlans.map((sp) => {
                const todayChapter = getSubPlanChapterToday(sp);
                const isDone = subPlanDone.has(sp.id);
                const spStreak = getSubPlanStreak(sp.id);
                return (
                  <div
                    key={sp.id}
                    className="flex items-center gap-3"
                    style={{
                      background: isDone ? "var(--sage-100)" : "var(--surface-card)",
                      border: `1px solid ${isDone ? "#D3DCCC" : "var(--line-hairline)"}`,
                      borderRadius: 14,
                      boxShadow: "var(--shadow-rest)",
                      padding: 16,
                      transition: "background 280ms, border-color 280ms",
                    }}
                  >
                    <button
                      onClick={() => { if (!isDone) handleSubPlanDone(sp.id); }}
                      aria-label={isDone ? "Read" : "Mark read"}
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        border: isDone ? "none" : "1.5px solid var(--line-strong)",
                        background: isDone ? "var(--sage-500)" : "transparent",
                        color: "#FFFDF7",
                        transition: "background 200ms",
                      }}
                    >
                      {isDone && <CheckIcon size={14} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="bh-serif" style={{ fontSize: 19, fontWeight: 500 }}>{sp.book} {todayChapter}</p>
                        <button onClick={() => { removeSubPlan(sp.id); refreshSubPlans(); }} title="Remove" style={{ fontSize: 12, color: "var(--text-muted)" }}>Remove</button>
                      </div>
                      {spStreak > 0 && (
                        <p className="flex items-center gap-1" style={{ fontSize: 13, marginTop: 2, color: isDone ? "var(--sage-700)" : "var(--text-muted)" }}>
                          <SunriseIcon size={14} /> {spStreak === 1 ? "Read today" : `${spStreak} mornings in a row`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Reading meter — free: it IS the year plan's progress ─── */}
          {!readingOpen && (
            <div className="bh-card" style={{ padding: 20 }}>
              <div className="flex items-baseline justify-between" style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{planLabel}</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  <span className="bh-serif" style={{ fontSize: 16, color: "var(--text-body)" }}>{totalRead}</span> of {planTotalChapters}
                </p>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "var(--surface-sunk)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    width: `${Math.min(100, (totalRead / planTotalChapters) * 100)}%`,
                    background: "linear-gradient(90deg, var(--gold-400), var(--gold-500))",
                    transition: "width 420ms var(--ease-bh)",
                  }}
                />
              </div>
              {avgChaptersPerDay !== null && avgChaptersPerDay > 0 && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>
                  You read about {avgChaptersPerDay >= 10 ? Math.round(avgChaptersPerDay) : avgChaptersPerDay.toFixed(1)} chapters a morning.
                </p>
              )}
            </div>
          )}

          {/* ─── Tomorrow — free: "what to read" is the free product ─── */}
          {tomorrowPreview && !readingOpen && (
            <div className="bh-sunk flex items-center justify-between" style={{ padding: "16px 20px" }}>
              <div>
                <p className="bh-eyebrow" style={{ color: "var(--text-muted)", marginBottom: 4 }}>Tomorrow</p>
                <h3 className="bh-serif" style={{ fontSize: 19, fontWeight: 500 }}>{tomorrowPreview.label}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>About {tomorrowPreview.count * Math.max(1, Math.round(estMins / todayInfo.chapters.length))} minutes, at your pace</p>
              </div>
              <span style={{ color: "var(--text-muted)" }}><ChevronRightIcon /></span>
            </div>
          )}

          {/* ─── Sign in nudge ──────────────────────────────────── */}
          {isSignedIn === false && !readingOpen && (
            <div className="bh-card flex items-center justify-between gap-3" style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Sign in and your mornings follow you to every device.</p>
              <a href="/login?mode=signin" className="bh-btn bh-btn-secondary flex-shrink-0" style={{ width: "auto", height: 40, padding: "0 18px", fontSize: 13 }}>
                Sign in
              </a>
            </div>
          )}

          {/* ─── Add a daily reading — Pro ──────────────────────── */}
          {subPlans.length === 0 && !showDevotionalPicker && !readingOpen && pro && (
            <button onClick={() => setShowDevotionalPicker(true)} className="bh-sunk w-full text-left" style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: 14, fontWeight: 500 }}>Add a small daily reading</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>A Psalm or a Proverb alongside your plan.</p>
            </button>
          )}
          {showDevotionalPicker && pro && (
            <div className="bh-card" style={{ padding: 18 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>Choose a daily reading</p>
                <button onClick={() => setShowDevotionalPicker(false)} style={{ color: "var(--text-muted)", fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEVOTIONAL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      const d = new Date();
                      const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                      addSubPlan({ label: preset.label, book: preset.book, totalChapters: preset.totalChapters, chaptersPerDay: preset.chaptersPerDay, startDate: iso });
                      refreshSubPlans();
                      setShowDevotionalPicker(false);
                    }}
                    className="text-left"
                    style={{ border: "1.5px solid var(--line-hairline)", borderRadius: 14, padding: "10px 12px", background: "var(--surface-card)" }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{preset.label}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{preset.book}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isNative && <BibleAffiliate count={2} heading="Own a Great Bible" variant="violet" />}

      {/* ─── Floating verse action bar ─────────────────────────── */}
      {selectedVerses.size > 0 && currentCh && chapterData && (
        <div className="fixed left-0 right-0 z-40 flex justify-center px-4" style={{ bottom: "calc(var(--bh-tabbar-h, 0px) + 24px)" }}>
          <div className="bh-rise flex items-center gap-2 max-w-sm w-full" style={{ background: "var(--ink-900)", borderRadius: 20, boxShadow: "0 12px 32px rgba(34,28,20,.28)", padding: "12px 16px" }}>
            <span className="flex-1" style={{ color: "var(--cream-100)", fontSize: 13, fontWeight: 600 }}>
              {selectedVerses.size} verse{selectedVerses.size > 1 ? "s" : ""}
            </span>
            <button
              onClick={() => {
                const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
                const versesWithText = sortedVerses
                  .map((vn) => chapterData.verses.find((v) => v.verse === vn))
                  .filter((v): v is { verse: number; text: string } => !!v);
                const text = formatVerseQuoteBlocks(currentCh.book, currentCh.chapter, versesWithText);
                // Share a rich verse link (unfurls as a branded verse card in iMessage)
                const shareUrl = verseShareUrl(
                  currentCh.book,
                  currentCh.chapter,
                  sortedVerses[0],
                  sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined
                );
                const shareText = text + "\n\n" + shareUrl;
                if (navigator.share) {
                  navigator.share({ text, title: `${currentCh.book} ${currentCh.chapter}`, url: shareUrl }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(shareText).catch(() => {});
                }
              }}
              style={{ background: "var(--gold-500)", color: "var(--text-on-accent)", fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 999 }}
            >
              Share
            </button>
            {/* Sharing a verse stays free — it's public-domain scripture.
                Keeping a highlight is saved-library territory, so it's Pro. */}
            {pro && (
            <button
              onClick={() => {
                if (highlightSaved) return;
                hapticMedium();
                const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
                const text = sortedVerses.map((vn) => {
                  const v = chapterData.verses.find((v) => v.verse === vn);
                  return v?.text ?? "";
                }).filter(Boolean).join(" ");
                saveHighlight({ book: currentCh.book, chapter: currentCh.chapter, verses: sortedVerses, text });
                setHighlightSaved(true);
                setTimeout(() => { setSelectedVerses(new Set()); setHighlightSaved(false); }, 2000);
              }}
              style={{
                background: highlightSaved ? "var(--sage-500)" : "var(--gold-100)",
                color: highlightSaved ? "#FFFDF7" : "var(--gold-700)",
                fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 999,
              }}
            >
              {highlightSaved ? "Kept" : "Keep"}
            </button>
            )}
            <button
              onClick={() => { setSelectedVerses(new Set()); setHighlightSaved(false); }}
              style={{ color: "var(--cream-300)", padding: 4 }}
              aria-label="Dismiss"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
