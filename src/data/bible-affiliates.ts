export interface BibleAffiliate {
  asin: string;
  title: string;
  shortTitle: string;
  translation: string;
  description: string;
  priceRange: string;
  tag: "study" | "large-print" | "journaling" | "devotional";
}

export const AFFILIATE_TAG = "hdsignals-20";

export const BIBLE_AFFILIATES: BibleAffiliate[] = [
  {
    asin: "1433502410",
    title: "ESV Study Bible (Hardcover)",
    shortTitle: "ESV Study Bible",
    translation: "ESV",
    description:
      "The gold standard for serious study — 20,000+ notes, maps, timelines, and articles.",
    priceRange: "$29–$49",
    tag: "study",
  },
  {
    asin: "1496439694",
    title: "NIV Life Application Study Bible",
    shortTitle: "NIV Life Application",
    translation: "NIV",
    description:
      "Connects Scripture to everyday situations. Most popular study Bible in the world.",
    priceRange: "$24–$44",
    tag: "study",
  },
  {
    asin: "0785215611",
    title: "KJV Large Print Bible",
    shortTitle: "KJV Large Print",
    translation: "KJV",
    description:
      "The beloved classic translation in a comfortable large-print format.",
    priceRange: "$14–$24",
    tag: "large-print",
  },
  {
    asin: "1496458729",
    title: "NLT Inspire Bible (Journaling)",
    shortTitle: "NLT Inspire Bible",
    translation: "NLT",
    description:
      "Wide margins for notes and art. Perfect for journaling your reading journey.",
    priceRange: "$24–$34",
    tag: "journaling",
  },
  {
    asin: "0785215387",
    title: "NASB MacArthur Study Bible",
    shortTitle: "NASB MacArthur",
    translation: "NASB",
    description:
      "Verse-by-verse study notes from John MacArthur covering the entire Bible.",
    priceRange: "$34–$54",
    tag: "study",
  },
  {
    asin: "0310452880",
    title: "The Jesus Bible (NIV)",
    shortTitle: "The Jesus Bible",
    translation: "NIV",
    description:
      "See how every story in Scripture points to Jesus. Beautiful full-color design.",
    priceRange: "$29–$39",
    tag: "devotional",
  },
];

export function getAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}
