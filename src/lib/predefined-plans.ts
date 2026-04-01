/**
 * Predefined reading plans for BibleHabit.
 * Each plan defines a starting point, chapters per day, and metadata.
 */

export interface PredefinedPlan {
  id: number;
  slug: string;
  title: string;
  description: string;
  versesPerDay: number; // chapters per day
  durationDays: number;
  startBook: string;
  startChapter: number;
  category: 'whole-bible' | 'new-testament' | 'old-testament' | 'topical';
}

export const PREDEFINED_PLANS: PredefinedPlan[] = [
  {
    id: 1,
    slug: "whole-bible-1-year",
    title: "Read the Whole Bible in 1 Year",
    description: "Cover all 1,189 chapters of the Bible in 365 days — about 3–4 chapters per day.",
    versesPerDay: 4,
    durationDays: 365,
    startBook: "Genesis",
    startChapter: 1,
    category: "whole-bible",
  },
  {
    id: 2,
    slug: "new-testament-90-days",
    title: "New Testament in 90 Days",
    description: "Read the entire New Testament in 90 days — about 3 chapters per day.",
    versesPerDay: 3,
    durationDays: 90,
    startBook: "Matthew",
    startChapter: 1,
    category: "new-testament",
  },
  {
    id: 3,
    slug: "whole-bible-2-years",
    title: "Read the Whole Bible in 2 Years",
    description: "A gentle pace through the entire Bible — about 2 chapters per day over 2 years.",
    versesPerDay: 2,
    durationDays: 730,
    startBook: "Genesis",
    startChapter: 1,
    category: "whole-bible",
  },
  {
    id: 4,
    slug: "psalms-proverbs",
    title: "Psalms & Proverbs in 6 Months",
    description: "Dive deep into the wisdom books — 1 chapter per day through Psalms and Proverbs.",
    versesPerDay: 1,
    durationDays: 181,
    startBook: "Psalms",
    startChapter: 1,
    category: "topical",
  },
  {
    id: 5,
    slug: "gospels-30-days",
    title: "The Four Gospels in 30 Days",
    description: "Walk with Jesus through Matthew, Mark, Luke, and John — about 3 chapters per day.",
    versesPerDay: 3,
    durationDays: 30,
    startBook: "Matthew",
    startChapter: 1,
    category: "new-testament",
  },
  {
    id: 6,
    slug: "old-testament-9-months",
    title: "Old Testament in 9 Months",
    description: "Cover the entire Old Testament in 270 days — about 3 chapters per day.",
    versesPerDay: 3,
    durationDays: 270,
    startBook: "Genesis",
    startChapter: 1,
    category: "old-testament",
  },
];

export function getPlanById(id: number): PredefinedPlan | undefined {
  return PREDEFINED_PLANS.find((p) => p.id === id);
}

export function getPlanBySlug(slug: string): PredefinedPlan | undefined {
  return PREDEFINED_PLANS.find((p) => p.slug === slug);
}
