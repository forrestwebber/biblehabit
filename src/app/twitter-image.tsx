import { ImageResponse } from "next/og";

export const alt = "BibleHabit — Meet your Bible reading where it is.";
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
          background: "linear-gradient(115deg, #F7F2E8 0%, #F5EBD8 34%, #F6E4C4 60%, #F3EAD9 100%)",
          fontFamily: "Georgia, serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft dawn glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -100,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "radial-gradient(circle, #FBEFC8 0%, rgba(251,239,200,0) 68%)",
            display: "flex",
          }}
        />

        {/* Logo lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "radial-gradient(circle at 50% 68%, #F2D793 0%, #C9962E 58%, #A97C1E 100%)",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 40, color: "#221C14", fontWeight: 700, letterSpacing: 0.5, display: "flex" }}>
            BibleHabit
          </div>
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 58,
            color: "#221C14",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 920,
            display: "flex",
          }}
        >
          Meet your Bible reading where it is.
        </div>

        {/* Decorative divider */}
        <div
          style={{
            width: 140,
            height: 2,
            background: "linear-gradient(90deg, transparent, #C9962E, transparent)",
            marginTop: 32,
            marginBottom: 32,
            display: "flex",
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#5C5142",
            fontWeight: 400,
            fontStyle: "italic",
            display: "flex",
          }}
        >
          Pacing that adapts to your real life. No streaks to break.
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 44,
            fontSize: 20,
            color: "#8A6A1E",
            letterSpacing: 3,
            textTransform: "lowercase",
            fontFamily: "Georgia, serif",
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
            height: 6,
            background: "linear-gradient(90deg, transparent 8%, #C9962E 50%, transparent 92%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
