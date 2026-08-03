import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseVerseSlug, verseShareUrl } from "@/lib/verse-link";
import { fetchVerseText } from "@/lib/verse-fetch";

export const revalidate = 86400; // verse text is immutable — cache a day

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseVerseSlug(slug);
  if (!parsed) return { title: "BibleHabit — Daily Bible Reading" };

  const data = await fetchVerseText(parsed);
  const joined = data ? data.verses.map((v) => v.text).join(" ") : "";
  const excerpt = joined
    ? `“${joined.length > 150 ? joined.slice(0, 150).trimEnd() + "…" : joined}” (KJV)`
    : "Read the Bible. Build the habit. A few quiet minutes a day.";
  const title = `${parsed.reference} — KJV`;
  const url = verseShareUrl(parsed.book, parsed.chapter, parsed.verse, parsed.verseEnd);

  return {
    title: `${title} | BibleHabit`,
    description: excerpt,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: excerpt,
      url,
      siteName: "BibleHabit",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: excerpt,
    },
  };
}

export default async function VersePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = parseVerseSlug(slug);
  if (!parsed) notFound();

  const data = await fetchVerseText(parsed);
  // Whole-chapter links can be long — show at most 8 verses on-page, then invite in.
  const shown = data ? data.verses.slice(0, 8) : [];
  const truncated = data ? data.verses.length > shown.length : false;

  return (
    <div className="bh-app flex flex-col" style={{ minHeight: "100vh" }}>
      <div className="flex-1 mx-auto w-full max-w-lg flex flex-col justify-center" style={{ padding: "48px 24px 32px" }}>
        <div className="text-center" style={{ marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="BibleHabit" width={52} height={52} className="mx-auto" style={{ marginBottom: 16 }} />
          <p className="bh-eyebrow" style={{ color: "var(--text-accent)" }}>Daily Scripture · King James Version</p>
        </div>

        <div className="bh-card-hero" style={{ borderRadius: 20, border: "1px solid var(--gold-200)", background: "linear-gradient(180deg, var(--gold-100) 0%, var(--cream-50) 55%)", padding: "32px 26px" }}>
          {shown.length > 0 ? (
            <blockquote className="bh-serif" style={{ fontSize: 22, lineHeight: 1.65, color: "var(--text-body)" }}>
              {shown.map((v, i) => (
                <span key={v.verse}>
                  {i > 0 && " "}
                  {parsed.verse === undefined || shown.length > 1 ? (
                    <sup style={{ fontSize: 12, color: "var(--gold-700)", marginRight: 4 }}>{v.verse}</sup>
                  ) : null}
                  {v.text}
                </span>
              ))}
              {truncated && <span style={{ color: "var(--text-muted)" }}> …</span>}
            </blockquote>
          ) : (
            <p className="bh-serif" style={{ fontSize: 20, lineHeight: 1.6, color: "var(--text-secondary)", fontStyle: "italic" }}>
              Open your Bible to {parsed.reference} — this verse is waiting for you there.
            </p>
          )}
          <p className="bh-serif" style={{ fontSize: 17, fontStyle: "italic", color: "var(--gold-700)", marginTop: 18 }}>
            — {parsed.reference}
          </p>
        </div>

        <div style={{ marginTop: 28 }}>
          <a href="/today" className="bh-btn bh-btn-primary">
            Read today&apos;s chapter on BibleHabit
          </a>
          <a href="/" className="bh-btn bh-btn-quiet" style={{ marginTop: 6 }}>
            A few quiet minutes a day — start your habit
          </a>
        </div>
      </div>

      <p className="text-center" style={{ fontSize: 12, color: "var(--text-muted)", padding: "0 24px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        King James Version · public domain · biblehabit.co
      </p>
    </div>
  );
}
