import type { Metadata, Viewport } from "next";
import { Lora, Public_Sans } from "next/font/google";
import "./globals.css";

// The whole site has always styled with fontFamily: "var(--font-serif)" but nothing ever
// loaded Lora — every heading has been rendering in the system serif fallback.
// next/font self-hosts both faces, which is what the design handoff asks for.
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
  display: "swap",
});
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import ChatWidget from "@/components/ChatWidget";
import MobileTabBar from "@/components/MobileTabBar";
import AppleEntitlementSync from "@/components/AppleEntitlementSync";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // Required for iPhone notch / Dynamic Island safe areas
};

export const metadata: Metadata = {
  title: "BibleHabit — Daily Bible Reading, on iPhone and the web",
  description:
    "Build a daily Scripture habit. Pick your plan and pace, read one clear assignment a day, watch the streak grow. Free forever — now on the App Store.",
  metadataBase: new URL("https://biblehabit.co"),
  // Apple Smart App Banner — Safari on iOS offers the real App Store install.
  appleWebApp: { capable: true, title: "BibleHabit" },
  other: { "apple-itunes-app": "app-id=6761791015" },
  openGraph: {
    title: "BibleHabit — Daily Bible Reading, on iPhone and the web",
    description:
      "Pick your plan and pace. One clear reading a day. Free forever — now on the App Store.",
    url: "https://biblehabit.co",
    siteName: "BibleHabit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BibleHabit — Daily Bible Reading, on iPhone and the web",
    description:
      "Pick your plan and pace. One clear reading a day. Free forever — now on the App Store.",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${publicSans.variable}`}>
      <body>
        <GoogleAnalytics gaId="G-X1P8GGT5RP" />
        <AppleEntitlementSync />
        {children}
        <ChatWidget />
        <MobileTabBar />
      </body>
    </html>
  );
}
