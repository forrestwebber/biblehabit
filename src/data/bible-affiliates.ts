export interface BibleAffiliate {
  asin: string;
  title: string;
  shortTitle: string;
  translation: string;
  description: string;
  priceRange: string;
  tag: "study" | "large-print" | "journaling" | "devotional";
}

export const AFFILIATE_TAG = "hookedtobooks-20";

// Every ASIN below was opened on amazon.com on 2026-09-10 and matched to its
// card. Four of the six had been pointing at the wrong product (the NIV Life
// Application card opened Nancy Guthrie's "God Does His Best Work with
// Empty"). Book ASINs are ISBN-10s — a valid-looking one is not proof it is
// the right book, so check the live product page before changing any.
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
    asin: "1496439465",
    title: "NIV Life Application Study Bible, Third Edition (Hardcover)",
    shortTitle: "NIV Life Application",
    translation: "NIV",
    description:
      "Connects Scripture to everyday situations. Most popular study Bible in the world.",
    priceRange: "$40–$60",
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
    asin: "1496487834",
    title: "NLT Inspire Bible (Journaling)",
    shortTitle: "NLT Inspire Bible",
    translation: "NLT",
    description:
      "Wide margins for notes and art. Perfect for journaling your reading journey.",
    priceRange: "$30–$50",
    tag: "journaling",
  },
  {
    asin: "0785230300",
    title: "NASB MacArthur Study Bible (Hardcover)",
    shortTitle: "NASB MacArthur",
    translation: "NASB",
    description:
      "Verse-by-verse study notes from John MacArthur covering the entire Bible.",
    priceRange: "$28–$50",
    tag: "study",
  },
  {
    asin: "0310452198",
    title: "The Jesus Bible (NIV)",
    shortTitle: "The Jesus Bible",
    translation: "NIV",
    description:
      "See how every story in Scripture points to Jesus. Beautiful full-color design.",
    priceRange: "$26–$50",
    tag: "devotional",
  },
];

export function getAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}
