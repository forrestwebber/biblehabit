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
  /** Background style: 'white' | 'violet' (default: 'white') */
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
  const sectionBg = variant === "violet" ? "#F2E9D6" : "#FFFDF8";
  const cardBg = variant === "violet" ? "#FFFDF8" : "#FBF4E4";

  return (
    <section className="py-12 px-6" style={{ background: sectionBg }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5" style={{ color: "#C9962E" }} />
              <h2 className="text-xl font-semibold" style={{ fontFamily: "'Lora', serif", color: "#221C14" }}>{heading}</h2>
            </div>
            <p className="text-sm" style={{ color: "#5C5142" }}>{subheading}</p>
          </div>
          <a
            href="https://www.amazon.com/s?k=study+bible&tag=hookedtobooks-20"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold flex items-center gap-1 whitespace-nowrap transition"
            style={{ color: "#8A6A1E" }}
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
              className="rounded-xl p-5 flex-shrink-0 w-52 snap-start flex flex-col transition"
              style={{ background: cardBg, border: "1px solid rgba(34,28,20,0.07)" }}
            >
              {/* Translation badge */}
              <span
                className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 w-fit"
                style={{ color: "#8A6A1E", background: "rgba(201,150,46,0.14)" }}
              >
                {bible.translation}
              </span>

              {/* Title */}
              <h3 className="font-bold text-sm leading-snug mb-1" style={{ color: "#221C14" }}>
                {bible.shortTitle}
              </h3>

              {/* Tag */}
              <span className="text-xs mb-2" style={{ color: "#8A7F6E" }}>
                {TAG_LABELS[bible.tag]}
              </span>

              {/* Description */}
              <p className="text-xs leading-relaxed flex-1 mb-3" style={{ color: "#5C5142" }}>
                {bible.description}
              </p>

              {/* Price + CTA */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm font-bold" style={{ color: "#8A6A1E" }}>
                  {bible.priceRange}
                </span>
                <span className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "#8A6A1E" }}>
                  Amazon <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs mt-4 text-center" style={{ color: "#8A7F6E" }}>
          As an Amazon Associate, we earn from qualifying purchases. This helps
          keep BibleHabit free.
        </p>
      </div>
    </section>
  );
}
