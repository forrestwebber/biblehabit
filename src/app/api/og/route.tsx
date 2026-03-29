import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const verse = searchParams.get("verse") || "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.";
  const ref = searchParams.get("ref") || "John 3:16";

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
          backgroundColor: "#faf5f0",
          padding: "60px",
        }}
      >
        <div style={{ fontSize: 24, color: "#b45309", fontWeight: 700, marginBottom: 20, letterSpacing: 4, textTransform: "uppercase" }}>
          BibleHabit
        </div>
        <div style={{ fontSize: 36, color: "#1c1917", textAlign: "center", lineHeight: 1.5, maxWidth: 900, fontStyle: "italic" }}>
          \u201c{verse.length > 200 ? verse.slice(0, 200) + "..." : verse}\u201d
        </div>
        <div style={{ fontSize: 28, color: "#78716c", marginTop: 24 }}>
          \u2014 {ref}
        </div>
        <div style={{ fontSize: 18, color: "#a8a29e", marginTop: 40 }}>
          biblehabit.co
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
