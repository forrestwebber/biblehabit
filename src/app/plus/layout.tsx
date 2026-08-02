import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BibleHabit Plus — pacing that follows you",
  description:
    "The pacing engine, and room for more than one thing you're reading. $2.99 a month or $19.99 a year.",
  openGraph: {
    title: "BibleHabit Plus — pacing that follows you",
    description:
      "The pacing engine, and room for more than one thing you're reading. $2.99 a month or $19.99 a year.",
    url: "https://biblehabit.co/plus",
    siteName: "BibleHabit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BibleHabit Plus — pacing that follows you",
    description:
      "The pacing engine, and room for more than one thing you're reading.",
  },
};

export default function PlusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
