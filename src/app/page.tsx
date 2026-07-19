"use client";
import { useState, useRef, useEffect } from 'react';
import { BookOpen, Heart, Share2, Star, ArrowRight, Calendar, TrendingUp, Smartphone, Compass, CheckCircle } from 'lucide-react';
import NavBar from '@/components/NavBar';
import BibleAffiliate from '@/components/BibleAffiliate';
import { getTodaysVerse, slugifyReference } from '@/data/verses';
import { BIBLE_BOOKS } from '@/data/bible';

const INK = "#221C14";
const SOFT_INK = "#5A4F3F";
const BODY = "#5C5142";
const META = "#8A7F6E";
const GOLD = "#C9962E";
const GOLD_HOVER = "#B5841F";
const LINK = "#8A6A1E";
const CARD = "#FFFDF8";
const TILE = "#FBF4E4";
const PARCHMENT = "#F7F2E8";
const BAND = "#F2E9D6";
const SERIF = "'Lora', serif";

const verse = getTodaysVerse();
const todaysVerse = {
  text: verse.text,
  reference: verse.reference,
  translation: "KJV"
};

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
        className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition"
        style={{ border: "1.5px solid rgba(34,28,20,0.18)", color: INK, background: "transparent" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = LINK; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(34,28,20,0.18)"; e.currentTarget.style.color = INK; }}
      >
        <Share2 className="h-5 w-5" /> Share This Verse
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 rounded-xl p-3 flex flex-wrap gap-2 z-10 min-w-max"
          style={{ background: CARD, border: "1px solid rgba(34,28,20,0.08)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.4)" }}
        >
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTextWithUrl)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm rounded-lg transition whitespace-nowrap" style={{ background: TILE, color: INK }}>Twitter/X</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm rounded-lg transition whitespace-nowrap" style={{ background: TILE, color: INK }}>Facebook</a>
          <a href={`sms:?body=${encodeURIComponent(shareTextWithUrl)}`} className="px-3 py-2 text-sm rounded-lg transition whitespace-nowrap" style={{ background: TILE, color: INK }}>iMessage</a>
          <button onClick={handleCopy} className="px-3 py-2 text-sm rounded-lg transition whitespace-nowrap cursor-pointer" style={{ background: TILE, color: INK }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-xs font-semibold uppercase mb-3.5"
      style={{ letterSpacing: "0.08em", color: GOLD }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: PARCHMENT, color: INK }}>
      {/* Nav */}
      <NavBar />

      {/* Hero — Today's Verse */}
      <section id="verse" className="relative overflow-hidden">
        <div className="absolute inset-0 bh-hero-bg" />
        <div
          className="absolute rounded-full"
          style={{
            top: "-140px",
            right: "-80px",
            width: 520,
            height: 520,
            background: "radial-gradient(circle, #FBEFC8 0%, rgba(251,239,200,0) 68%)",
            filter: "blur(6px)",
          }}
        />
        <div className="relative text-center py-20 px-6 max-w-3xl mx-auto bh-rise">
          <p className="text-sm uppercase font-semibold mb-6" style={{ letterSpacing: "0.08em", color: LINK }}>Today&apos;s Verse</p>
          <blockquote
            className="leading-relaxed mb-6"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(26px,4vw,38px)", color: INK, letterSpacing: "-0.01em" }}
          >
            &ldquo;{todaysVerse.text}&rdquo;
          </blockquote>
          <p className="text-lg mb-8" style={{ color: BODY }}>&mdash; {todaysVerse.reference} ({todaysVerse.translation})</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="/welcome"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition"
              style={{ background: INK, color: "#F7F2E8", boxShadow: "0 6px 20px rgba(34,28,20,0.22)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#000"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = INK; }}
            >
              <BookOpen className="h-5 w-5" /> Start Your Reading Plan
            </a>
            <ShareButton verse={todaysVerse.text} ref={todaysVerse.reference} />
          </div>
          <p className="text-xs mt-6" style={{ color: META }}>Free forever for one goal. No streaks to break.</p>
        </div>
      </section>

      {/* Pick Up Where I Am */}
      <section className="py-16 px-6" style={{ background: BAND, borderTop: "1px solid rgba(34,28,20,0.05)", borderBottom: "1px solid rgba(34,28,20,0.05)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <SectionEyebrow>Meet you where you are</SectionEyebrow>
            <h2 className="text-3xl font-semibold mb-3" style={{ fontFamily: SERIF, color: INK, letterSpacing: "-0.01em" }}>Already Reading? Pick Up Where You Are.</h2>
            <p style={{ color: BODY }}>Been reading a physical Bible for months? We will catch up to you.</p>
          </div>

          <div className="rounded-3xl p-8 max-w-2xl mx-auto" style={{ background: CARD, border: "1px solid rgba(34,28,20,0.07)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: SOFT_INK }}>I&apos;m currently reading...</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                    style={{ background: TILE, border: "1px solid rgba(34,28,20,0.1)", color: INK }}
                  >
                    {BIBLE_BOOKS.map((b) => (
                      <option key={b.name} selected={b.name === "2 Kings"}>{b.name}</option>
                    ))}
                  </select>
                  <select
                    className="w-28 px-4 py-3 rounded-xl"
                    style={{ background: TILE, border: "1px solid rgba(34,28,20,0.1)", color: INK }}
                  >
                    {Array.from(
                      { length: BIBLE_BOOKS.find((b) => b.name === "2 Kings")?.chapters ?? 1 },
                      (_, i) => i + 1
                    ).map((c) => (
                      <option key={c} selected={c === 5}>Ch. {c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: SOFT_INK }}>I usually read about...</label>
                <div className="grid grid-cols-4 gap-2">
                  <button className="py-3 rounded-xl text-center transition text-sm" style={{ border: "2px solid rgba(34,28,20,0.12)" }}>
                    <p className="font-bold" style={{ color: INK }}>1 chapter</p>
                    <p className="text-xs" style={{ color: META }}>~5 min</p>
                  </button>
                  <button className="py-3 rounded-xl text-center text-sm" style={{ border: `2px solid ${GOLD}`, background: TILE }}>
                    <p className="font-bold" style={{ color: LINK }}>2-3 chapters</p>
                    <p className="text-xs" style={{ color: LINK }}>~15 min</p>
                  </button>
                  <button className="py-3 rounded-xl text-center transition text-sm" style={{ border: "2px solid rgba(34,28,20,0.12)" }}>
                    <p className="font-bold" style={{ color: INK }}>4-5 chapters</p>
                    <p className="text-xs" style={{ color: META }}>~25 min</p>
                  </button>
                  <button className="py-3 rounded-xl text-center transition text-sm" style={{ border: "2px solid rgba(34,28,20,0.12)" }}>
                    <p className="font-bold" style={{ color: INK }}>6+ chapters</p>
                    <p className="text-xs" style={{ color: META }}>~30+ min</p>
                  </button>
                </div>
              </div>

              {/* Instant preview */}
              <div className="rounded-2xl p-5 space-y-3" style={{ background: TILE }}>
                <h4 className="text-sm font-bold uppercase" style={{ letterSpacing: "0.04em", color: LINK }}>Your personalized plan</h4>
                <div className="flex justify-between text-sm">
                  <span style={{ color: META }}>Picking up from</span>
                  <span className="font-semibold" style={{ color: INK }}>2 Kings, Chapter 5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: META }}>Chapters remaining</span>
                  <span className="font-semibold" style={{ color: INK }}>864 chapters to Revelation</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: META }}>At your pace (2-3/night)</span>
                  <span className="font-semibold" style={{ color: INK }}>~345 days</span>
                </div>
                <hr style={{ borderColor: "rgba(34,28,20,0.1)" }} />
                <div className="flex justify-between text-sm -mx-2 px-3 py-2 rounded-lg" style={{ background: CARD }}>
                  <span className="font-semibold" style={{ color: LINK }}>You&apos;ll finish by</span>
                  <span className="font-bold" style={{ color: LINK }}>February 2027 &#10003;</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: META }}>By this Christmas</span>
                  <span className="font-medium" style={{ color: SOFT_INK }}>You&apos;ll be in Acts</span>
                </div>
              </div>

              <a
                href="/welcome"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition"
                style={{ background: INK, color: "#F7F2E8" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#000"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = INK; }}
              >
                Pick Up Where I Am <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP: Reading Plan Calculator */}
      <section className="py-16 px-6" style={{ background: PARCHMENT }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <SectionEyebrow>Build your plan</SectionEyebrow>
            <h2 className="text-3xl font-semibold mb-3" style={{ fontFamily: SERIF, color: INK, letterSpacing: "-0.01em" }}>Build Your Custom Reading Plan</h2>
            <p style={{ color: BODY }}>Starting fresh or picking up where you left off — we meet you where you are.</p>
          </div>

          <div className="rounded-3xl p-8" style={{ background: CARD, border: "1px solid rgba(34,28,20,0.07)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Input */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: SOFT_INK }}>Where are you in the Bible?</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                      style={{ background: TILE, border: "1px solid rgba(34,28,20,0.1)", color: INK }}
                    >
                      {BIBLE_BOOKS.map((b) => (
                        <option key={b.name} selected={b.name === "Genesis"}>{b.name}</option>
                      ))}
                    </select>
                    <select
                      className="w-24 px-4 py-3 rounded-xl"
                      style={{ background: TILE, border: "1px solid rgba(34,28,20,0.1)", color: INK }}
                    >
                      {Array.from(
                        { length: BIBLE_BOOKS.find((b) => b.name === "Genesis")?.chapters ?? 1 },
                        (_, i) => i + 1
                      ).map((c) => (
                        <option key={c} selected={c === 1}>Ch. {c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: SOFT_INK }}>Choose your pace</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="py-3 px-2 rounded-xl text-center transition text-sm" style={{ border: "2px solid rgba(34,28,20,0.12)" }}>
                      <p className="font-bold" style={{ color: INK }}>6 months</p>
                      <p className="text-xs" style={{ color: META }}>~6.6 ch/day</p>
                    </button>
                    <button className="py-3 px-2 rounded-xl text-center text-sm" style={{ border: `2px solid ${GOLD}`, background: TILE }}>
                      <p className="font-bold" style={{ color: LINK }}>12 months</p>
                      <p className="text-xs" style={{ color: LINK }}>~3.3 ch/day</p>
                    </button>
                    <button className="py-3 px-2 rounded-xl text-center transition text-sm" style={{ border: "2px solid rgba(34,28,20,0.12)" }}>
                      <p className="font-bold" style={{ color: INK }}>18 months</p>
                      <p className="text-xs" style={{ color: META }}>~2.2 ch/day</p>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: SOFT_INK }}>Preferred translation</label>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ border: `2px solid ${GOLD}`, background: TILE, color: LINK }}>KJV</button>
                    <button className="flex-1 py-2 rounded-xl text-sm font-semibold transition" style={{ border: "2px solid rgba(34,28,20,0.12)", color: SOFT_INK }}>WEB</button>
                    <button className="flex-1 py-2 rounded-xl text-sm font-semibold transition" style={{ border: "2px solid rgba(34,28,20,0.12)", color: SOFT_INK }}>ESV*</button>
                    <button className="flex-1 py-2 rounded-xl text-sm font-semibold transition" style={{ border: "2px solid rgba(34,28,20,0.12)", color: SOFT_INK }}>NIV*</button>
                  </div>
                  <p className="text-xs mt-1" style={{ color: META }}>*Copyrighted translations linked via Amazon</p>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="rounded-2xl p-6" style={{ background: TILE, border: "1px solid rgba(34,28,20,0.06)" }}>
                <h3 className="font-bold text-sm uppercase mb-4" style={{ letterSpacing: "0.04em", color: LINK }}>Your Plan Preview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: META }}>Starting from</span>
                    <span className="font-semibold" style={{ color: INK }}>Genesis 1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: META }}>Chapters per day</span>
                    <span className="font-semibold" style={{ color: INK }}>~3.3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: META }}>Reading time</span>
                    <span className="font-semibold" style={{ color: INK }}>~15 min/day</span>
                  </div>
                  <hr style={{ borderColor: "rgba(34,28,20,0.08)" }} />
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: META }}>By June 2026</span>
                    <span className="font-medium" style={{ color: SOFT_INK }}>Finishing Deuteronomy</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: META }}>By September 2026</span>
                    <span className="font-medium" style={{ color: SOFT_INK }}>Through Psalms</span>
                  </div>
                  <div className="flex justify-between items-center -mx-2 px-2 py-2 rounded-lg" style={{ background: CARD }}>
                    <span className="text-sm font-semibold" style={{ color: LINK }}>By March 2027</span>
                    <span className="font-bold" style={{ color: LINK }}>Revelation ✓ Complete!</span>
                  </div>
                </div>
                <a
                  href="/welcome"
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition"
                  style={{ background: INK, color: "#F7F2E8" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#000"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = INK; }}
                >
                  Start This Plan <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP: Daily Reading View */}
      <section className="py-16 px-6" style={{ background: BAND, borderTop: "1px solid rgba(34,28,20,0.05)", borderBottom: "1px solid rgba(34,28,20,0.05)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <SectionEyebrow>Your daily reading</SectionEyebrow>
            <h2 className="text-3xl font-semibold mb-3" style={{ fontFamily: SERIF, color: INK, letterSpacing: "-0.01em" }}>Clean. Distraction-Free.</h2>
            <p style={{ color: BODY }}>Just you and the Word.</p>
          </div>

          <div className="rounded-3xl max-w-2xl mx-auto overflow-hidden" style={{ background: CARD, border: "1px solid rgba(34,28,20,0.07)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: INK, color: "#F4EEE1" }}>
              <div>
                <p className="text-xs uppercase" style={{ letterSpacing: "0.06em", color: "#E7B84E" }}>Day 47 of 365</p>
                <h3 className="text-lg font-bold" style={{ fontFamily: SERIF }}>Genesis 47–49</h3>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "#C6BBA4" }}>Your streak</p>
                <p className="text-2xl font-bold">🔥 47</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2" style={{ background: "#EFE7D5" }}>
              <div className="h-2" style={{ width: '13%', background: "linear-gradient(90deg,#E7B84E,#C9962E)" }} />
            </div>
            {/* Reading content */}
            <div className="px-6 py-6">
              <h4 className="text-lg font-bold mb-3" style={{ color: INK }}>Genesis 47 <span className="text-sm font-normal" style={{ color: META }}>KJV</span></h4>
              <div className="leading-relaxed space-y-2 text-sm" style={{ color: SOFT_INK }}>
                <p><sup className="mr-1" style={{ color: GOLD }}>1</sup>Then Joseph came and told Pharaoh, and said, My father and my brethren, and their flocks, and their herds, and all that they have, are come out of the land of Canaan; and, behold, they are in the land of Goshen.</p>
                <p><sup className="mr-1" style={{ color: GOLD }}>2</sup>And he took some of his brethren, even five men, and presented them unto Pharaoh.</p>
                <p><sup className="mr-1" style={{ color: GOLD }}>3</sup>And Pharaoh said unto his brethren, What is your occupation? And they said unto Pharaoh, Thy servants are shepherds, both we, and also our fathers.</p>
                <p className="italic" style={{ color: META }}>... continue reading ...</p>
              </div>
            </div>
            {/* Actions */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(34,28,20,0.07)" }}>
              <button className="text-sm transition flex items-center gap-1" style={{ color: SOFT_INK }}>
                <Compass className="h-4 w-4" /> Related verses & commentary
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition font-semibold text-sm"
                style={{ background: INK, color: "#F7F2E8" }}
              >
                <CheckCircle className="h-4 w-4" /> Mark as Done
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP: Progress Dashboard */}
      <section className="py-16 px-6" style={{ background: PARCHMENT }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <SectionEyebrow>Track your journey</SectionEyebrow>
            <h2 className="text-3xl font-semibold mb-3" style={{ fontFamily: SERIF, color: INK, letterSpacing: "-0.01em" }}>Watch Your Progress Grow</h2>
            <p style={{ color: BODY }}>Day by day, gently.</p>
          </div>

          <div className="rounded-3xl p-8 max-w-2xl mx-auto" style={{ background: CARD, border: "1px solid rgba(34,28,20,0.07)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.3)" }}>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center rounded-xl p-4" style={{ background: TILE }}>
                <p className="text-3xl font-bold" style={{ fontFamily: SERIF, color: LINK }}>47</p>
                <p className="text-xs mt-1" style={{ color: META }}>Day Streak</p>
              </div>
              <div className="text-center rounded-xl p-4" style={{ background: TILE }}>
                <p className="text-3xl font-bold" style={{ fontFamily: SERIF, color: LINK }}>155</p>
                <p className="text-xs mt-1" style={{ color: META }}>Chapters Read</p>
              </div>
              <div className="text-center rounded-xl p-4" style={{ background: TILE }}>
                <p className="text-3xl font-bold" style={{ fontFamily: SERIF, color: LINK }}>13%</p>
                <p className="text-xs mt-1" style={{ color: META }}>Complete</p>
              </div>
            </div>
            {/* Calendar mockup */}
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: SOFT_INK }}>March 2026</h4>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="font-medium py-1" style={{ color: META }}>{d}</div>)}
                {Array.from({length: 31}, (_, i) => (
                  <div
                    key={i}
                    className="py-1.5 rounded-md font-semibold"
                    style={i < 29 ? { background: GOLD, color: INK } : { background: "#EFE7D5", color: META }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: META }}>29 of 31 days completed this month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 px-6" style={{ background: BAND, borderTop: "1px solid rgba(34,28,20,0.05)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionEyebrow>Everything you need</SectionEyebrow>
            <h2 className="text-3xl font-semibold" style={{ fontFamily: SERIF, color: INK, letterSpacing: "-0.01em" }}>Built for a Gentler Habit</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Calendar className="h-7 w-7" style={{ color: GOLD }} />, title: "Custom Reading Plans", desc: "Start from Genesis or 2 Chronicles — wherever you are. Pick 6, 12, or 18 months. See your future." },
              { icon: <BookOpen className="h-7 w-7" style={{ color: GOLD }} />, title: "Multiple Translations", desc: "Read in KJV or WEB for free. ESV, NIV, and more available via Amazon." },
              { icon: <Heart className="h-7 w-7" style={{ color: GOLD }} />, title: "Gentle Reflow", desc: "Miss a day? We quietly resize the road ahead. No guilt, no broken streaks." },
              { icon: <Compass className="h-7 w-7" style={{ color: GOLD }} />, title: "Cross-References", desc: "Discover related verses and historical commentary as you read." },
              { icon: <TrendingUp className="h-7 w-7" style={{ color: GOLD }} />, title: "Progress Milestones", desc: "See where you'll be by any date. Celebrate finishing each book." },
              { icon: <Smartphone className="h-7 w-7" style={{ color: GOLD }} />, title: "iOS App Coming Soon", desc: "Push notifications for your daily reading. Included with your account." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl transition" style={{ background: CARD, border: "1px solid rgba(34,28,20,0.06)", boxShadow: "0 12px 30px -20px rgba(34,28,20,0.3)" }}>
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: SERIF, color: INK, letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p className="leading-relaxed" style={{ color: BODY }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Your Own Copy — Amazon Affiliate */}
      <BibleAffiliate
        count={4}
        heading="Get Your Own Copy"
        subheading="Hold Scripture in your hands. Our recommended editions for every kind of reader."
        variant="white"
      />

      {/* Stats */}
      <section className="py-16 px-6" style={{ background: BAND }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="grid grid-cols-3 gap-6">
            <div><p className="text-4xl font-bold" style={{ fontFamily: SERIF, color: LINK }}>1,189</p><p className="mt-1 text-sm" style={{ color: META }}>Chapters in the Bible</p></div>
            <div><p className="text-4xl font-bold" style={{ fontFamily: SERIF, color: LINK }}>~15 min</p><p className="mt-1 text-sm" style={{ color: META }}>Average daily reading</p></div>
            <div><p className="text-4xl font-bold" style={{ fontFamily: SERIF, color: LINK }}>$0</p><p className="mt-1 text-sm" style={{ color: META }}>Cost. Forever.</p></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center" style={{ background: PARCHMENT }}>
        <h2 className="text-3xl font-semibold mb-4" style={{ fontFamily: SERIF, color: INK, letterSpacing: "-0.01em" }}>Start Your Bible Habit Today</h2>
        <p className="mb-8 max-w-xl mx-auto" style={{ color: BODY }}>Free forever. No credit card. No catch. Just Scripture, one day at a time.</p>
        <a
          href="/welcome"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl transition font-semibold text-lg"
          style={{ background: GOLD, color: INK, boxShadow: "0 8px 22px -8px rgba(201,150,46,0.7)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = GOLD_HOVER; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
        >
          <Star className="h-5 w-5" /> Create Your Free Account
        </a>
        <p className="text-xs mt-4" style={{ color: META }}>iOS app coming soon &mdash; included with your account</p>
      </section>

      {/* Footer */}
      <footer style={{ background: INK, color: "#C6BBA4" }}>
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <span
              className="inline-block w-6 h-6 rounded-full"
              style={{ background: "radial-gradient(circle at 50% 68%, #F2D793 0%, #C9962E 58%, #A97C1E 100%)" }}
            />
            <span className="text-lg font-semibold" style={{ fontFamily: SERIF, color: "#F4EEE1" }}>BibleHabit</span>
          </div>
          <p suppressHydrationWarning className="text-sm">&copy; {new Date().getFullYear()} BibleHabit, a division of HD Signals LLC. Scripture changes everything.</p>
          <div className="flex justify-center gap-4 mt-3 text-xs">
            <a href="/privacy" className="transition hover:text-[#F4EEE1]">Privacy Policy</a>
            <a href="/terms" className="transition hover:text-[#F4EEE1]">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
