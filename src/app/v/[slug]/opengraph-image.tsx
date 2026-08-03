import { ImageResponse } from "next/og";
import { parseVerseSlug } from "@/lib/verse-link";
import { fetchVerseText } from "@/lib/verse-fetch";

export const alt = "Scripture verse card from BibleHabit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Serif for the verse itself — fetched once per render, cached by the platform.
async function loadLora(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600&display=swap",
      { next: { revalidate: 604800 } }
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url, { next: { revalidate: 604800 } }).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

// BibleHabit sunrise-over-book logo mark (from the design handoff), Satori-safe JSX.
function LogoMark({ s = 72 }: { s?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={s} height={s} fill="none">
      <g stroke="#C9962E" strokeWidth="2" strokeLinecap="round">
        <path d="M32 6v6M18.5 10.6l2.6 5.4M45.5 10.6l-2.6 5.4M8.2 21.4l4.9 3.4M55.8 21.4l-4.9 3.4" />
      </g>
      <circle cx="32" cy="33" r="10.5" fill="#F0DCAE" />
      <circle cx="32" cy="33" r="10.5" stroke="#C9962E" strokeWidth="2" />
      <path
        d="M6 38.5c8-3.4 15.3-3.4 25 1.2 9.7-4.6 17-4.6 25-1.2v15c-8-3.4-15.3-3.4-25 1.2-9.7-4.6-17-4.6-25-1.2v-15Z"
        fill="#FCFAF4"
        stroke="#221C14"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M31 39.7v15" stroke="#221C14" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = parseVerseSlug(slug);

  let text = "Read the Bible. Build the habit.";
  let reference = "BibleHabit";
  if (parsed) {
    reference = parsed.reference;
    const data = await fetchVerseText(parsed);
    if (data) text = data.verses.map((v) => v.text).join(" ");
  }

  // Graceful scaling for long verses; hard truncation keeps the card composed.
  const MAX_CHARS = 340;
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS).trimEnd().replace(/[,;:]?$/, "") + " …";
  const fontSize =
    text.length <= 90 ? 52 : text.length <= 160 ? 44 : text.length <= 240 ? 38 : 32;

  const lora = await loadLora();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #F8EED6 0%, #FCFAF4 42%, #FCFAF4 100%)",
          fontFamily: "Lora, Georgia, serif",
          position: "relative",
          padding: "56px 84px",
        }}
      >
        {/* Gold top rule */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 6, background: "#C9962E", display: "flex" }} />
        {/* Dawn glow */}
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: 300,
            width: 600,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,150,46,0.16) 0%, rgba(201,150,46,0) 70%)",
            display: "flex",
          }}
        />
        {/* Oversized quote mark */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 62,
            fontSize: 200,
            color: "rgba(201,150,46,0.16)",
            lineHeight: 1,
            display: "flex",
          }}
        >
          {"“"}
        </div>

        {/* Header: logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <LogoMark s={64} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 600, color: "#221C14", display: "flex" }}>BibleHabit</div>
            <div style={{ fontSize: 16, color: "#8F6716", letterSpacing: 3, textTransform: "uppercase", display: "flex" }}>
              Daily Scripture · KJV
            </div>
          </div>
        </div>

        {/* Verse */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 24 }}>
          <div
            style={{
              fontSize,
              lineHeight: 1.42,
              color: "#221C14",
              fontStyle: "italic",
              display: "flex",
              maxWidth: 1010,
            }}
          >
            {`“${text}”`}
          </div>
          <div
            style={{
              marginTop: 26,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ width: 54, height: 2, background: "#C9962E", display: "flex" }} />
            <div style={{ fontSize: 30, fontWeight: 600, color: "#8F6716", display: "flex" }}>{reference}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 19, color: "#6B5C48", display: "flex" }}>
            Read the Bible. Build the habit — a few quiet minutes a day.
          </div>
          <div style={{ fontSize: 19, color: "#8F6716", fontWeight: 600, letterSpacing: 1, display: "flex" }}>
            biblehabit.co
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: lora
        ? [{ name: "Lora", data: lora, style: "normal" as const, weight: 500 as const }]
        : undefined,
    }
  );
}
