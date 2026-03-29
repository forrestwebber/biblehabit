import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BibleHabit — Daily Bible Reading";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          backgroundColor: "#f8fafc",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ fontSize: 28, color: "#7c3aed", fontWeight: 700, marginBottom: 24, letterSpacing: 6, textTransform: "uppercase" }}>
          BibleHabit
        </div>
        <div style={{ fontSize: 48, color: "#0f172a", textAlign: "center", lineHeight: 1.4, maxWidth: 900, fontStyle: "italic", padding: "0 40px" }}>
          Build a daily Scripture habit. One verse at a time.
        </div>
        <div style={{ fontSize: 22, color: "#64748b", marginTop: 32 }}>
          Free forever — biblehabit.co
        </div>
      </div>
    ),
    { ...size }
  );
}
