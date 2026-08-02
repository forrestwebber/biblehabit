"use client";
import { ArrowRight, BookOpen } from "lucide-react";
import { BIBLE_AFFILIATES, getAmazonUrl } from "@/data/bible-affiliates";

interface BibleAffiliateProps {
  /** How many cards to display (default: 4) */
  count?: number;
  /** Heading text */
  heading?: string;
  /** Subheading text */
  subheading?: string;
  /** Background style: 'white' (card surface) | 'violet' (legacy name — sunk parchment) */
  variant?: "white" | "violet";
}

const TAG_LABELS: Record<string, string> = {
  study: "Study",
  "large-print": "Large Print",
  journaling: "Journaling",
  devotional: "Devotional",
};

export default function BibleAffiliate({
  count = 4,
  heading = "Get a Physical Copy",
  subheading = "Every great reader owns a great Bible. Our top picks.",
  variant = "white",
}: BibleAffiliateProps) {
  const bibles = BIBLE_AFFILIATES.slice(0, count);
  // Warm parchment palette — matches the BibleHabit cream/gold design system.
  const sectionBg = variant === "violet" ? "var(--cream-200, #EFE7D6)" : "var(--cream-50, #FCFAF4)";
  const cardBg = variant === "violet" ? "var(--cream-50, #FCFAF4)" : "var(--cream-100, #F7F2E8)";

  return (
    <section className="py-12 px-6" style={{ background: sectionBg }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5" style={{ color: "var(--gold-600, #A87C1F)" }} />
              <h2 className="bh-serif text-xl" style={{ fontWeight: 500, color: "var(--text-body, #221C14)" }}>{heading}</h2>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary, #6B5C48)" }}>{subheading}</p>
          </div>
          <a
            href="https://www.amazon.com/s?k=study+bible&tag=hookedtobooks-20"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold flex items-center gap-1 whitespace-nowrap"
            style={{ color: "var(--gold-700, #8F6716)" }}
          >
            Browse all <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {/* Cards — horizontal scroll on mobile */}
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
          {bibles.map((bible) => (
            <a
              key={bible.asin}
              href={getAmazonUrl(bible.asin)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="rounded-xl p-5 hover:shadow-md transition flex-shrink-0 w-52 snap-start flex flex-col"
              style={{ background: cardBg, border: "1px solid var(--line-hairline, #E3D9C4)" }}
            >
              {/* Translation badge */}
              <span
                className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 w-fit"
                style={{ color: "var(--gold-700, #8F6716)", background: "var(--gold-100, #F8EED6)" }}
              >
                {bible.translation}
              </span>

              {/* Title */}
              <h3 className="font-bold text-sm leading-snug mb-1" style={{ color: "var(--text-body, #221C14)" }}>
                {bible.shortTitle}
              </h3>

              {/* Tag */}
              <span className="text-xs mb-2" style={{ color: "var(--text-muted, #8A7A64)" }}>
                {TAG_LABELS[bible.tag]}
              </span>

              {/* Description */}
              <p className="text-xs leading-relaxed flex-1 mb-3" style={{ color: "var(--text-secondary, #6B5C48)" }}>
                {bible.description}
              </p>

              {/* Price + CTA */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm font-bold" style={{ color: "var(--text-body, #221C14)" }}>
                  {bible.priceRange}
                </span>
                <span className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "var(--gold-700, #8F6716)" }}>
                  Amazon <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs mt-4 text-center" style={{ color: "var(--text-muted, #8A7A64)" }}>
          As an Amazon Associate, we earn from qualifying purchases. This helps
          keep BibleHabit free.
        </p>
      </div>
    </section>
  );
}
