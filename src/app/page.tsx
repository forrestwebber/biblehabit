"use client";

/**
 * biblehabit.co landing page.
 *
 * Rebuilt 2026-09-09 to the Claude Design handoff
 * (~/sol-ops-media/biblehabit-design-handoff/design_handoff_biblehabit_marketing):
 * Hero -> App Store -> Today's Verse -> How It Works -> Goal Types -> Gentle By Design
 * -> Email capture -> Physical Bibles -> Pricing -> Footer.
 *
 * Three places where the handoff was NOT followed, on purpose, because it would have
 * shipped claims the product cannot back:
 *   1. Pricing. The handoff specifies $4.99/mo and $39/yr. Real pricing is $2.99/mo and
 *      $24.99 -> $19.99/yr (src/app/pricing/page.tsx). Real numbers win.
 *   2. Plus features. The handoff invents "Family sharing (up to 6)" and "Audio pacing".
 *      Neither exists. The lists below are PLUS_FEATURES / FREE_FEATURES verbatim.
 *   3. Reminders. The handoff promises "gentle morning reminders" / "a soft nudge in the
 *      morning". There is no reminder code anywhere in this repo and no sender. Cut.
 */

import { useState, useRef, useEffect } from 'react';
import { Share2, Star } from 'lucide-react';
import NavBar from '@/components/NavBar';
import BibleAffiliate from '@/components/BibleAffiliate';
import DailyVerseSignup from '@/components/DailyVerseSignup';
import AppStoreSection, { AppStoreBadge, APP_STORE_URL } from '@/components/AppStoreSection';
import { getTodaysVerse, slugifyReference } from '@/data/verses';

const INK = "#221C14";
const INK90 = "#3A3226";
const BODY = "#5C5142";
const META = "#8A7F6E";
const MUTED = "#C6BBA4";
const GOLD = "#C9962E";
const GOLD_LIGHT = "#E7B84E";
const LINK = "#8A6A1E";
const CARD = "#FFFDF8";
const INSET = "#FBF4E4";
const TRACK = "#EFE7D5";
const PARCHMENT = "#F7F2E8";
const BAND = "#F2E9D6";
const SERIF = "var(--font-serif)";

const CONTAINER = "mx-auto w-full";
const containerStyle = { maxWidth: 1180, paddingLeft: "clamp(20px,5vw,44px)", paddingRight: "clamp(20px,5vw,44px)" };
const sectionPad = { paddingTop: "clamp(56px,8vw,104px)", paddingBottom: "clamp(56px,8vw,104px)" };

const verse = getTodaysVerse();
const todaysVerse = { text: verse.text, reference: verse.reference, translation: "KJV" };

/* ---------------------------------------------------------------- shared bits */

function Eyebrow({ children, color = GOLD }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="uppercase" style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", color, marginBottom: 14 }}>
      {children}
    </p>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px,3.6vw,44px)", lineHeight: 1.1, letterSpacing: "-0.015em", color: INK }}>
      {children}
    </h2>
  );
}

function Check({ color = GOLD }: { color?: string }) {
  return <span aria-hidden style={{ color, fontSize: 18, lineHeight: 1.4, flexShrink: 0 }}>✓</span>;
}

/* ------------------------------------------------------------ share (kept) */

function ShareButton({ verse, ref: verseRef }: { verse: string; ref: string }) {
  // Share the per-verse page (with its own OG card), never the bare homepage.
  const shareUrl = `https://biblehabit.co/verse/${slugifyReference(verseRef)}`;
  const shareText = `"${verse}" — ${verseRef}`;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: verseRef, text: shareText, url: shareUrl });
        return;
      } catch {}
    }
    setOpen((v) => !v);
  };

  const shareTextWithUrl = `${shareText}\n\n${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareTextWithUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 transition"
        style={{ border: "1.5px solid rgba(34,28,20,0.18)", color: INK, background: "transparent", borderRadius: 14, padding: "13px 22px", fontWeight: 600, fontSize: 16 }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = LINK; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(34,28,20,0.18)"; e.currentTarget.style.color = INK; }}
      >
        <Share2 className="h-5 w-5" /> Share this verse
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 rounded-xl p-3 flex flex-wrap gap-2 z-10 min-w-max"
          style={{ background: CARD, border: "1px solid rgba(34,28,20,0.08)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.4)" }}
        >
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTextWithUrl)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm rounded-lg transition whitespace-nowrap" style={{ background: INSET, color: INK }}>Twitter/X</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm rounded-lg transition whitespace-nowrap" style={{ background: INSET, color: INK }}>Facebook</a>
          <a href={`sms:&body=${encodeURIComponent(shareTextWithUrl)}`} className="px-3 py-2 text-sm rounded-lg transition whitespace-nowrap" style={{ background: INSET, color: INK }}>Messages</a>
          <button onClick={handleCopy} className="px-3 py-2 text-sm rounded-lg transition whitespace-nowrap" style={{ background: INSET, color: INK }}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- hero card */

function PacingCard() {
  return (
    <div
      className="bh-rise-delay"
      style={{
        background: CARD,
        borderRadius: 26,
        padding: 30,
        maxWidth: 400,
        margin: "0 auto",
        border: "1px solid rgba(34,28,20,0.05)",
        boxShadow: "0 24px 60px -18px rgba(34,28,20,0.28), inset 0 2px 0 rgba(255,255,255,0.6)",
      }}
    >
      {/* Status banner */}
      <div style={{ position: "relative", borderRadius: 18, padding: 22, overflow: "hidden", marginBottom: 22, background: "linear-gradient(160deg, #FDE9BE 0%, #F6CE86 48%, #E9AE5A 100%)" }}>
        <div
          className="bh-float"
          aria-hidden
          style={{ position: "absolute", top: -30, right: -10, width: 96, height: 96, background: "radial-gradient(circle, #FFF6DE 0%, rgba(255,246,222,0) 70%)" }}
        />
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#6E4E12" }}>🌤 On pace</p>
          <p style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 30, color: "#3A2A0C", letterSpacing: "-0.01em", marginTop: 8 }}>You&apos;re 3 days ahead</p>
          <p style={{ fontSize: 14.5, color: "#7A5A1E" }}>Nicely done — take the morning slow.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
        <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 17, color: INK }}>Jeremiah 29</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: META }}>Whole Bible in a year</span>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: TRACK, overflow: "hidden", margin: "10px 0 8px" }}>
        <div className="bh-fill" style={{ width: "64%", height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD})` }} />
      </div>
      <div className="flex items-baseline justify-between" style={{ fontSize: 12.5, color: META }}>
        <span>762 of 1,189 chapters</span>
        <span>~3 chapters/day</span>
      </div>

      {/* Today's reading */}
      <div className="flex items-center" style={{ gap: 12, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(34,28,20,0.07)" }}>
        <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(201,150,46,0.14)", fontSize: 18 }} aria-hidden>📖</div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: INK }}>Today: Jeremiah 29–31</p>
          <p style={{ fontSize: 12.5, color: META }}>Finishes June 3, right on your goal</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export default function HomePage() {
  return (
    <div style={{ background: PARCHMENT, color: INK, minHeight: "100vh" }}>
      <NavBar />

      {/* ============================================================ 1. HERO */}
      <section id="top" style={{ position: "relative", overflow: "hidden" }}>
        <div className="absolute inset-0 bh-hero-bg" aria-hidden />
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{ top: -140, right: -80, width: 520, height: 520, background: "radial-gradient(circle, #FBEFC8 0%, rgba(251,239,200,0) 68%)", filter: "blur(6px)" }}
        />
        <div
          className={`${CONTAINER} relative grid items-center bh-hero-grid`}
          style={{ ...containerStyle, paddingTop: "clamp(48px,7vw,92px)", paddingBottom: "clamp(48px,7vw,92px)", gap: "clamp(36px,5vw,72px)" }}
        >
          <div className="bh-rise">
            <span
              className="inline-block uppercase"
              style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", color: LINK, background: "rgba(201,150,46,0.12)", padding: "7px 14px", borderRadius: 999, marginBottom: 24 }}
            >
              A gentler way to read
            </span>
            <h1
              style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(38px,5.4vw,64px)", lineHeight: 1.04, letterSpacing: "-0.02em", color: INK, marginBottom: 20, textWrap: "balance" }}
            >
              Meet your Bible reading
              <br />
              where it is.
            </h1>
            <p style={{ fontSize: "clamp(17px,1.5vw,20px)", lineHeight: 1.6, color: BODY, maxWidth: "30ch", marginBottom: 34 }}>
              Pacing that adapts to your real life. Tell us where you are, and we&apos;ll gently move you toward your goal — recalculating whenever life happens.
            </p>
            <div className="flex flex-wrap items-center" style={{ gap: 14 }}>
              <AppStoreBadge />
              <a
                href="/welcome"
                className="transition"
                style={{ border: "1.5px solid rgba(34,28,20,0.18)", borderRadius: 14, padding: "13px 22px", fontWeight: 600, fontSize: 16, color: INK }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = LINK; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(34,28,20,0.18)"; e.currentTarget.style.color = INK; }}
              >
                Start free on the web →
              </a>
            </div>
            <p style={{ fontSize: 13.5, color: META, marginTop: 20 }}>Free forever for one goal. No credit card.</p>
          </div>

          <div className="bh-hero-card">
            <PacingCard />
          </div>
        </div>
      </section>

      {/* ================================================ 2. NOW ON THE APP STORE */}
      <AppStoreSection />

      {/* ==================================================== 3. TODAY'S VERSE */}
      <section id="verse" style={{ ...sectionPad, background: PARCHMENT }}>
        <div className={CONTAINER} style={{ ...containerStyle, maxWidth: 780, textAlign: "center" }}>
          <Eyebrow>Today&apos;s verse</Eyebrow>
          <blockquote style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(24px,3.4vw,36px)", lineHeight: 1.35, letterSpacing: "-0.01em", color: INK, margin: "0 0 18px" }}>
            &ldquo;{todaysVerse.text}&rdquo;
          </blockquote>
          <p style={{ fontSize: 17, color: BODY, marginBottom: 28 }}>
            &mdash; {todaysVerse.reference} ({todaysVerse.translation})
          </p>
          <div className="flex justify-center">
            <ShareButton verse={todaysVerse.text} ref={todaysVerse.reference} />
          </div>
        </div>
      </section>

      {/* ==================================================== 4. HOW IT WORKS */}
      <section id="how" style={{ ...sectionPad, background: BAND, borderTop: "1px solid rgba(34,28,20,0.05)", borderBottom: "1px solid rgba(34,28,20,0.05)" }}>
        <div className={CONTAINER} style={containerStyle}>
          <div style={{ maxWidth: 640, margin: "0 auto 56px", textAlign: "center" }}>
            <Eyebrow>How it works</Eyebrow>
            <H2>Three quiet steps. Then just read.</H2>
          </div>
          <div className="grid bh-grid-3" style={{ gap: "clamp(20px,3vw,34px)" }}>
            {[
              { label: "Step 01", title: "Tell us where you are", body: "“Started 18 months ago, currently in Jeremiah.” No guilt about the gaps — we just need your bookmark." },
              { label: "Step 02", title: "Pick a goal", body: "Finish the whole Bible by a date, or build a daily rhythm you'll actually keep. Change it anytime." },
              { label: "Step 03", title: "We pace you", body: "Each morning you get exactly today's reading — sized to your goal and recalculated when life happens." },
            ].map((s) => (
              <div key={s.label} style={{ background: CARD, border: "1px solid rgba(34,28,20,0.06)", borderRadius: 20, padding: "32px 28px", boxShadow: "0 12px 30px -20px rgba(34,28,20,0.3)" }}>
                <p style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 15, color: GOLD, marginBottom: 18 }}>{s.label}</p>
                <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 23, letterSpacing: "-0.01em", color: INK, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 15.5, lineHeight: 1.6, color: BODY }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= 5. THE TWO GOAL TYPES */}
      <section id="goals" style={{ ...sectionPad, background: PARCHMENT }}>
        <div className={CONTAINER} style={containerStyle}>
          <div style={{ maxWidth: 680, margin: "0 auto 56px", textAlign: "center" }}>
            <Eyebrow>Two ways to read</Eyebrow>
            <H2>Pick the goal that fits your season.</H2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: BODY, marginTop: 14 }}>
              Both are paced the same gentle way. Switch between them whenever you like.
            </p>
          </div>

          <div className="grid bh-grid-2" style={{ gap: "clamp(20px,3vw,32px)" }}>
            {/* Card A — finish goals */}
            <div style={{ background: CARD, border: "1px solid rgba(34,28,20,0.07)", borderRadius: 22, padding: "clamp(28px,3vw,40px)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
              <span style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: LINK, background: "rgba(201,150,46,0.12)", padding: "6px 13px", borderRadius: 999, marginBottom: 20 }}>🎯 Finish goals</span>
              <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 27, letterSpacing: "-0.01em", color: INK, marginBottom: 10 }}>The whole Bible in a year</h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: BODY, marginBottom: 22 }}>
                A finish line and a date. We divide the road that&apos;s left into daily readings so you arrive right on time.
              </p>
              <div style={{ background: INSET, borderRadius: 14, padding: 20 }}>
                <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, color: INK }}>1,189 chapters</span>
                  <span style={{ fontSize: 13, color: META }}>≈ 3 chapters a day</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: TRACK, overflow: "hidden", margin: "12px 0 10px" }}>
                  <div style={{ width: "78%", height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD})` }} />
                </div>
                <p style={{ fontSize: 13, color: META }}>Genesis → Revelation, on your schedule.</p>
              </div>
            </div>

            {/* Card B — habit goals */}
            <div style={{ background: CARD, border: "1px solid rgba(34,28,20,0.07)", borderRadius: 22, padding: "clamp(28px,3vw,40px)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
              <span style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: LINK, background: "rgba(201,150,46,0.12)", padding: "6px 13px", borderRadius: 999, marginBottom: 20 }}>🌿 Habit goals</span>
              <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 27, letterSpacing: "-0.01em", color: INK, marginBottom: 10 }}>A rhythm for every morning</h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: BODY, marginBottom: 22 }}>
                No finish line — just a shape for your daily reading. We keep the mix balanced and moving.
              </p>
              <div style={{ background: INSET, borderRadius: 14, padding: "14px 20px" }}>
                {[
                  { icon: "🕊️", label: "A Psalm", ref: "Psalm 91" },
                  { icon: "💡", label: "A Proverb", ref: "Proverbs 19" },
                  { icon: "✉️", label: "A New Testament passage", ref: "Luke 8" },
                ].map((r, i, arr) => (
                  <div
                    key={r.label}
                    className="flex items-center"
                    style={{ gap: 12, padding: "11px 0", borderBottom: i === arr.length - 1 ? "none" : "1px solid rgba(34,28,20,0.06)" }}
                  >
                    <span aria-hidden style={{ fontSize: 17 }}>{r.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 500, color: INK, flex: 1 }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: META }}>{r.ref}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================== 6. GENTLE BY DESIGN */}
      <section id="gentle" style={{ ...sectionPad, background: BAND, borderTop: "1px solid rgba(34,28,20,0.05)", borderBottom: "1px solid rgba(34,28,20,0.05)" }}>
        <div className={`${CONTAINER} grid bh-grid-2 items-center`} style={{ ...containerStyle, gap: "clamp(36px,5vw,72px)" }}>
          <div>
            <Eyebrow>Gentle by design</Eyebrow>
            <H2>Miss a week? Your plan quietly reflows.</H2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: BODY, maxWidth: "42ch", margin: "18px 0 26px" }}>
              Life gets loud. When you step away, nothing breaks. Come back and today&apos;s reading is simply resized to the road ahead — no catch-up piles, no shame.
            </p>
            <div className="flex flex-col" style={{ gap: 14 }}>
              {[
                ["Automatic reflow.", "Your remaining chapters spread evenly across the time that's left."],
                ["No catch-up pile.", "Yesterday's unread chapters never stack on top of today's."],
                ["Pick up mid-stream.", "Tell us the last chapter you finished and your plan starts right there."],
              ].map(([lead, rest]) => (
                <div key={lead} className="flex" style={{ gap: 10 }}>
                  <Check />
                  <p style={{ fontSize: 15.5, lineHeight: 1.5, color: INK90 }}>
                    <strong style={{ fontWeight: 600 }}>{lead}</strong> {rest}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Reflow diagram */}
          <div style={{ background: CARD, border: "1px solid rgba(34,28,20,0.06)", borderRadius: 22, padding: 28, boxShadow: "0 20px 50px -26px rgba(34,28,20,0.3)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: META, marginBottom: 16 }}>Away 8 days · welcome back</p>
            <div className="flex flex-col" style={{ gap: 10 }}>
              <div className="flex items-center" style={{ gap: 12, background: INSET, borderRadius: 12, padding: "14px 16px", opacity: 0.65 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: MUTED, flexShrink: 0 }} />
                <span style={{ fontSize: 14.5, color: META, flex: 1 }}>Old plan: 24 chapters waiting</span>
                <span style={{ fontSize: 13, color: "#B0A48C", textDecoration: "line-through" }}>catch up</span>
              </div>
              <p aria-hidden style={{ textAlign: "center", fontSize: 20, color: GOLD, lineHeight: 1 }}>↓</p>
              <div className="flex items-center" style={{ gap: 12, background: "linear-gradient(120deg,#FDE9BE,#F6D79A)", borderRadius: 12, padding: 16, boxShadow: "0 6px 18px -8px rgba(201,150,46,0.5)" }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: "#3A8C4E", flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: "#3A2A0C", flex: 1 }}>Reflowed: back to ~3 a day</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#6E4E12" }}>on pace</span>
              </div>
            </div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, lineHeight: 1.55, color: BODY, marginTop: 20 }}>
              Right where you left off. Let&apos;s keep going, gently.
            </p>
          </div>
        </div>
      </section>

      {/* Daily-verse email capture — the only email-list entry point on the site. */}
      <section style={{ background: PARCHMENT, paddingLeft: "clamp(20px,5vw,44px)", paddingRight: "clamp(20px,5vw,44px)" }}>
        <DailyVerseSignup />
      </section>

      {/* Physical Bibles — Amazon affiliate */}
      <BibleAffiliate
        count={4}
        heading="Get Your Own Copy"
        subheading="Hold Scripture in your hands. Our recommended editions for every kind of reader."
        variant="white"
      />

      {/* ========================================================= 7. PRICING */}
      <section id="pricing" style={{ ...sectionPad, background: "linear-gradient(180deg, #F2E9D6, #EFE4CD)", borderTop: "1px solid rgba(34,28,20,0.05)" }}>
        <div className={CONTAINER} style={{ ...containerStyle, maxWidth: 1080 }}>
          <div style={{ maxWidth: 620, margin: "0 auto 52px", textAlign: "center" }}>
            <Eyebrow>Pricing</Eyebrow>
            <H2>Start free. Upgrade if it helps.</H2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: BODY, marginTop: 14 }}>
              The habit matters more than the plan. Free covers most readers well.
            </p>
          </div>

          <div className="grid bh-grid-2 items-start" style={{ gap: "clamp(20px,3vw,28px)" }}>
            {/* Free */}
            <div style={{ background: CARD, border: "1px solid rgba(34,28,20,0.08)", borderRadius: 22, padding: "clamp(28px,3vw,40px)", boxShadow: "0 12px 34px -24px rgba(34,28,20,0.3)" }}>
              <p style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: INK }}>Free</p>
              <div className="flex items-baseline" style={{ gap: 6, marginTop: 6 }}>
                <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 42, color: INK }}>$0</span>
                <span style={{ fontSize: 15, color: META }}>forever</span>
              </div>
              <p style={{ fontSize: 14.5, color: BODY, margin: "10px 0 24px" }}>Everything you need to build the habit.</p>
              <a
                href="/welcome"
                className="block text-center transition"
                style={{ border: "1.5px solid rgba(34,28,20,0.2)", borderRadius: 13, padding: 13, fontWeight: 600, color: INK, marginBottom: 26 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = LINK; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(34,28,20,0.2)"; e.currentTarget.style.color = INK; }}
              >
                Get started
              </a>
              <div className="flex flex-col" style={{ gap: 13 }}>
                {[
                  "Unlimited custom reading plans",
                  "Daily progress & streak tracking",
                  "KJV and WEB translations",
                  "Gentle reflow when you miss a day",
                  "Cross-references & notes",
                ].map((f) => (
                  <div key={f} className="flex" style={{ gap: 10 }}>
                    <Check />
                    <span style={{ fontSize: 15, color: INK90 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plus */}
            <div style={{ position: "relative", overflow: "hidden", background: INK, color: "#F4EEE1", borderRadius: 22, padding: "clamp(28px,3vw,40px)", boxShadow: "0 24px 56px -22px rgba(34,28,20,0.55)" }}>
              <div aria-hidden style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "radial-gradient(circle, rgba(201,150,46,0.4) 0%, rgba(201,150,46,0) 70%)" }} />
              <div style={{ position: "relative" }}>
                <div className="flex items-center" style={{ gap: 10 }}>
                  <p style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: "#F4EEE1" }}>BibleHabit Plus</p>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", background: GOLD, color: INK, padding: "4px 9px", borderRadius: 999 }}>POPULAR</span>
                </div>
                <div className="flex items-baseline" style={{ gap: 6, marginTop: 6 }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 42, color: "#F4EEE1" }}>$2.99</span>
                  <span style={{ fontSize: 15, color: MUTED }}>/month</span>
                </div>
                <p style={{ fontSize: 14, color: MUTED, margin: "8px 0 24px" }}>or $19.99/year — launch price, normally $24.99</p>
                <a
                  href="/pricing"
                  className="block text-center transition"
                  style={{ background: GOLD, color: INK, borderRadius: 13, padding: 13, fontWeight: 700, boxShadow: "0 8px 22px -8px rgba(201,150,46,0.7)", marginBottom: 26 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#DBA63A"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
                >
                  See Plus
                </a>
                <div className="flex flex-col" style={{ gap: 13 }}>
                  {[
                    "Everything in Free",
                    "Pacing projections — see your finish date update live",
                    "Personalized reflow suggestions when you fall behind",
                    "Multiple simultaneous reading goals",
                    "Streak repair — recover a broken streak once a month",
                  ].map((f) => (
                    <div key={f} className="flex" style={{ gap: 10 }}>
                      <Check color={GOLD_LIGHT} />
                      <span style={{ fontSize: 15, color: "#E9E2D2" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Closing CTA */}
          <div style={{ textAlign: "center", marginTop: 56 }}>
            <a
              href="/welcome"
              className="inline-flex items-center transition"
              style={{ gap: 8, background: GOLD, color: INK, borderRadius: 14, padding: "14px 28px", fontWeight: 600, fontSize: 17, boxShadow: "0 8px 22px -8px rgba(201,150,46,0.7)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#DBA63A"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
            >
              <Star className="h-5 w-5" /> Create your free account
            </a>
            <div className="flex flex-col items-center" style={{ gap: 8, marginTop: 24 }}>
              <AppStoreBadge />
              <p style={{ fontSize: 13, color: META }}>Or read on iPhone and iPad — free, same account.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== 8. FOOTER */}
      <footer style={{ background: INK, color: MUTED }}>
        <div className={CONTAINER} style={{ ...containerStyle, paddingTop: "clamp(48px,6vw,72px)", paddingBottom: "clamp(48px,6vw,72px)" }}>
          <div className="grid bh-footer-grid" style={{ gap: 40, alignItems: "start", paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <div className="flex items-center" style={{ gap: 10, marginBottom: 14 }}>
                <span style={{ width: 28, height: 28, borderRadius: 999, background: "radial-gradient(circle at 50% 68%, #F2D793 0%, #C9962E 58%, #A97C1E 100%)" }} />
                <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: "#F4EEE1" }}>BibleHabit</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: "34ch", marginBottom: 20 }}>
                A quieter way to keep reading — paced to your real life, so a missed week never turns into a catch-up pile.
              </p>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Download BibleHabit on the App Store" className="inline-block transition hover:opacity-85">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/app/app-store-badge-white.svg" alt="Download on the App Store" style={{ height: 44, width: "auto", display: "block" }} />
              </a>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 28 }}>
              <div>
                <p className="uppercase" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: META, marginBottom: 14 }}>Product</p>
                <div className="flex flex-col" style={{ gap: 11 }}>
                  {[
                    ["How it works", "#how"],
                    ["Goal types", "#goals"],
                    ["Gentle by design", "#gentle"],
                    ["Pricing", "#pricing"],
                    ["Get a physical Bible", "https://www.amazon.com/s?k=study+bible&tag=hookedtobooks-20"],
                  ].map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer sponsored" } : {})}
                      className="transition hover:text-[#F4EEE1]"
                      style={{ fontSize: 14.5, color: MUTED }}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p className="uppercase" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: META, marginBottom: 14 }}>Company</p>
                <div className="flex flex-col" style={{ gap: 11 }}>
                  {[["Privacy", "/privacy"], ["Terms", "/terms"], ["Contact", "/contact"]].map(([label, href]) => (
                    <a key={label} href={href} className="transition hover:text-[#F4EEE1]" style={{ fontSize: 14.5, color: MUTED }}>{label}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p suppressHydrationWarning style={{ paddingTop: 24, fontSize: 13, color: META }}>
            &copy; {new Date().getFullYear()} BibleHabit, a division of HD Signals LLC. Made for quiet mornings.
          </p>
        </div>
      </footer>
    </div>
  );
}
