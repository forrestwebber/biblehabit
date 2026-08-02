import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Your reading progress — BibleHabit";

export default function Image() {
  const cells: string[] = [];
  // A pleasant deterministic pattern for the brand heat map motif
  for (let i = 0; i < 7 * 16; i++) {
    const v = (i * 37) % 11;
    cells.push(v > 7 ? "#C9962E" : v > 4 ? "#F0DCAE" : "#EFE7D6");
  }
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
          padding: "60px",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#8F6716", fontWeight: 700, letterSpacing: 6, textTransform: "uppercase" as const, marginBottom: 28 }}>
          BibleHabit
        </div>
        <div style={{ display: "flex", fontSize: 60, color: "#221C14", textAlign: "center" as const, lineHeight: 1.2, fontFamily: "Georgia, serif", fontWeight: 500 }}>
          One square a morning.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, width: 16 * 34, marginTop: 42 }}>
          {cells.map((c, i) => (
            <div key={i} style={{ display: "flex", width: 26, height: 26, margin: 4, borderRadius: 6, backgroundColor: c }} />
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#8A7A64", marginTop: 42 }}>
          biblehabit.co/progress
        </div>
      </div>
    ),
    { ...size }
  );
}
