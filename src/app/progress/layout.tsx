import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your reading progress — BibleHabit",
  description: "Every morning you read fills in the map. Streaks, milestones, and kept verses.",
  openGraph: {
    title: "Your reading progress — BibleHabit",
    description: "Every morning you read fills in the map. Streaks, milestones, and kept verses.",
    url: "https://biblehabit.co/progress",
    siteName: "BibleHabit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your reading progress — BibleHabit",
    description: "Every morning you read fills in the map.",
  },
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
