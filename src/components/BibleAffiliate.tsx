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
  const bg = variant === "violet" ? "bg-violet-50" : "bg-white";
  const cardBg = variant === "violet" ? "bg-white" : "bg-violet-50";

  return (
    <section className={`py-12 px-6 ${bg}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-violet-600" />
              <h2 className="text-xl font-bold text-slate-900">{heading}</h2>
            </div>
            <p className="text-sm text-slate-500">{subheading}</p>
          </div>
          <a
            href="https://www.amazon.com/s?k=study+bible&tag=hdsignals-20"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-600 hover:text-violet-800 font-semibold flex items-center gap-1 whitespace-nowrap"
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
              className={`${cardBg} rounded-xl p-5 border border-violet-100 hover:border-violet-300 hover:shadow-md transition flex-shrink-0 w-52 snap-start flex flex-col`}
            >
              {/* Translation badge */}
              <span className="inline-block text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full mb-3 w-fit">
                {bible.translation}
              </span>

              {/* Title */}
              <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1">
                {bible.shortTitle}
              </h3>

              {/* Tag */}
              <span className="text-xs text-slate-400 mb-2">
                {TAG_LABELS[bible.tag]}
              </span>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-3">
                {bible.description}
              </p>

              {/* Price + CTA */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm font-bold text-violet-700">
                  {bible.priceRange}
                </span>
                <span className="text-xs text-violet-600 font-semibold flex items-center gap-0.5">
                  Amazon <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 mt-4 text-center">
          As an Amazon Associate, we earn from qualifying purchases. This helps
          keep BibleHabit free.
        </p>
      </div>
    </section>
  );
}
