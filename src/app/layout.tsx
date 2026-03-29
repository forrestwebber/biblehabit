import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BibleHabit — Daily Bible Reading",
  description: "Build a daily Scripture habit. One verse at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
