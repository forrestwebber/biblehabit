import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import NavBar from "@/components/NavBar";
import { getVerseBySlug, getAllVerseSlugs } from "@/data/verses";

const INK = "#221C14";
const BODY = "#5C5142";
const LINK = "#8A6A1E";
const META = "#8A7F6E";
const PARCHMENT = "#F7F2E8";
const SERIF = "'Lora', serif";

export function generateStaticParams() {
  return getAllVerseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const verse = getVerseBySlug(slug);
  if (!verse) return { title: "Verse not found — BibleHabit" };

  const title = `${verse.reference} (KJV) — BibleHabit`;
  const description = `"${verse.text}" — ${verse.reference}`;
  const url = `https://biblehabit.co/verse/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: verse.reference,
      description: verse.text,
      url,
      siteName: "BibleHabit",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: verse.reference,
      description: verse.text,
    },
  };
}

export default async function VersePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const verse = getVerseBySlug(slug);
  if (!verse) notFound();

  return (
    <div className="min-h-screen" style={{ background: PARCHMENT, color: INK }}>
      <NavBar />
      <section className="relative overflow-hidden">
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
          <p
            className="text-sm uppercase font-semibold mb-6"
            style={{ letterSpacing: "0.08em", color: LINK }}
          >
            Today&apos;s Verse
          </p>
          <blockquote
            className="leading-relaxed mb-6"
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(26px,4vw,38px)",
              color: INK,
              letterSpacing: "-0.01em",
            }}
          >
            &ldquo;{verse.text}&rdquo;
          </blockquote>
          <p className="text-lg mb-8" style={{ color: BODY }}>
            &mdash; {verse.reference} (KJV)
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition"
              style={{ background: INK, color: "#F7F2E8", boxShadow: "0 6px 20px rgba(34,28,20,0.22)" }}
            >
              <BookOpen className="h-5 w-5" /> Start Your Reading Plan
            </Link>
          </div>
          <p className="text-xs mt-6" style={{ color: META }}>
            Free forever for one goal. No streaks to break.
          </p>
        </div>
      </section>
    </div>
  );
}
