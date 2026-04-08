import { ImageResponse } from "next/og";

export const alt = "BibleHabit — Read the Bible. Build the habit.";
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
          background: "linear-gradient(145deg, #0c1222 0%, #1a1a3e 60%, #0f1a2e 100%)",
          fontFamily: "Georgia, serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow behind center content */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Thin gold cross */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 2,
            height: 100,
            background: "rgba(212,168,67,0.25)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 115,
            left: "50%",
            transform: "translateX(-50%)",
            width: 50,
            height: 2,
            background: "rgba(212,168,67,0.25)",
            display: "flex",
          }}
        />

        {/* Main title */}
        <div
          style={{
            fontSize: 72,
            color: "#d4a843",
            fontWeight: 700,
            letterSpacing: 4,
            marginTop: 60,
            display: "flex",
          }}
        >
          BibleHabit
        </div>

        {/* Decorative divider */}
        <div
          style={{
            width: 120,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.5), transparent)",
            marginTop: 28,
            marginBottom: 28,
            display: "flex",
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(235,230,220,0.85)",
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: 1,
            display: "flex",
          }}
        >
          Read the Bible. Build the habit.
        </div>

        {/* Decorative quotation marks */}
        <div
          style={{
            position: "absolute",
            left: 100,
            top: 200,
            fontSize: 160,
            color: "rgba(212,168,67,0.08)",
            fontFamily: "Georgia, serif",
            lineHeight: 1,
            display: "flex",
          }}
        >
          {"\u201C"}
        </div>
        <div
          style={{
            position: "absolute",
            right: 100,
            bottom: 140,
            fontSize: 160,
            color: "rgba(212,168,67,0.08)",
            fontFamily: "Georgia, serif",
            lineHeight: 1,
            display: "flex",
          }}
        >
          {"\u201D"}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "rgba(212,168,67,0.45)",
            letterSpacing: 3,
            textTransform: "lowercase",
            display: "flex",
          }}
        >
          biblehabit.co
        </div>

        {/* Bottom border accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 3,
            background: "linear-gradient(90deg, transparent 10%, rgba(212,168,67,0.3) 50%, transparent 90%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
