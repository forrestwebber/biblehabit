import type { Metadata } from "next";
import "./globals.css";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  title: "BibleHabit — Daily Bible Reading",
  description: "Build a daily Scripture habit. One verse at a time. Free forever.",
  metadataBase: new URL("https://biblehabit.co"),
  openGraph: {
    title: "BibleHabit — Daily Bible Reading",
    description: "Build a daily Scripture habit. One verse at a time. Free forever.",
    url: "https://biblehabit.co",
    siteName: "BibleHabit",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "BibleHabit — Daily Bible Reading" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BibleHabit — Daily Bible Reading",
    description: "Build a daily Scripture habit. One verse at a time. Free forever.",
    images: ["/og-image.png"],
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        {children}
      </body>
    </html>
  );
}
