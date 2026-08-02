import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "BibleHabit Plus — pacing that follows you";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F2E8",
          backgroundImage: "radial-gradient(60% 80% at 50% 100%, rgba(221,178,90,.35), rgba(221,178,90,0))",
          padding: "60px",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#8F6716", fontWeight: 700, letterSpacing: 6, textTransform: "uppercase" as const, marginBottom: 28 }}>
          BibleHabit Plus
        </div>
        <div style={{ display: "flex", fontSize: 64, color: "#221C14", textAlign: "center" as const, lineHeight: 1.2, maxWidth: 900, fontFamily: "Georgia, serif", fontWeight: 500 }}>
          Pacing that follows you.
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#6B5C48", marginTop: 24, textAlign: "center" as const }}>
          It learns how fast you actually read, then re-spreads the plan when life happens.
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#8A7A64", marginTop: 48 }}>
          biblehabit.co
        </div>
      </div>
    ),
    { ...size }
  );
}
