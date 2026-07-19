import { ImageResponse } from "next/og";
import { getVerseBySlug, getAllVerseSlugs } from "@/data/verses";

export const alt = "BibleHabit — Today's Verse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllVerseSlugs().map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const verse = getVerseBySlug(slug);
  const text = verse?.text ?? "Meet your Bible reading where it is.";
  const reference = verse ? `${verse.reference} (KJV)` : "BibleHabit";

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
          padding: "0 100px",
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
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "radial-gradient(circle at 50% 68%, #F2D793 0%, #C9962E 58%, #A97C1E 100%)",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 32, color: "#221C14", fontWeight: 700, letterSpacing: 0.5, display: "flex" }}>
            BibleHabit
          </div>
        </div>

        {/* Verse text */}
        <div
          style={{
            fontSize: text.length > 140 ? 38 : 46,
            color: "#221C14",
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.25,
            maxWidth: 980,
            display: "flex",
          }}
        >
          &ldquo;{text.length > 220 ? text.slice(0, 217) + "..." : text}&rdquo;
        </div>

        {/* Decorative divider */}
        <div
          style={{
            width: 120,
            height: 2,
            background: "linear-gradient(90deg, transparent, #C9962E, transparent)",
            marginTop: 30,
            marginBottom: 26,
            display: "flex",
          }}
        />

        {/* Reference */}
        <div
          style={{
            fontSize: 30,
            color: "#8A6A1E",
            fontWeight: 600,
            fontStyle: "italic",
            display: "flex",
          }}
        >
          {reference}
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
