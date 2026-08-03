import type { Metadata, Viewport } from "next";
import { Lora, Karla } from "next/font/google";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-lora", weight: ["400", "500", "600"], style: ["normal", "italic"] });
const karla = Karla({ subsets: ["latin"], variable: "--font-karla", weight: ["400", "500", "600", "700"] });
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import AppStoreBanner from "@/components/AppStoreBanner";
import ChatWidget from "@/components/ChatWidget";
import MobileTabBar from "@/components/MobileTabBar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // Required for iPhone notch / Dynamic Island safe areas
};

export const metadata: Metadata = {
  title: "BibleHabit — Daily Bible Reading",
  description: "Build a daily Scripture habit. One morning at a time. 7 days free.",
  metadataBase: new URL("https://biblehabit.co"),
  openGraph: {
    title: "BibleHabit — Daily Bible Reading",
    description: "Build a daily Scripture habit. One morning at a time. 7 days free.",
    url: "https://biblehabit.co",
    siteName: "BibleHabit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BibleHabit — Daily Bible Reading",
    description: "Build a daily Scripture habit. One morning at a time. 7 days free.",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${karla.variable}`}>
      <body>
        <GoogleAnalytics gaId="G-X1P8GGT5RP" />
        <AppStoreBanner />
        {children}
        <ChatWidget />
        <MobileTabBar />
      </body>
    </html>
  );
}
