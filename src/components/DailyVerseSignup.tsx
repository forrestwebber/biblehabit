"use client";
import { useState } from "react";
import { Mail, Check } from "lucide-react";

/**
 * Daily-verse email capture. Built 2026-07-30 because BibleHabit had no email
 * capture at all and the new Facebook page starts driving traffic on 7/31.
 * Palette matches the homepage tokens exactly (parchment / ink / gold).
 */

const INK = "#221C14";
const BODY = "#5C5142";
const META = "#8A7F6E";
const GOLD = "#C9962E";
const GOLD_HOVER = "#B5841F";
const CARD = "#FFFDF8";
const BAND = "#F2E9D6";
const SERIF = "'Lora', serif";

export default function DailyVerseSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("done");
        setMsg(data.message || "You're in.");
        setEmail("");
      } else {
        setState("error");
        setMsg(data.error || "Something went wrong — please try again.");
      }
    } catch {
      setState("error");
      setMsg("Something went wrong — please try again.");
    }
  }

  return (
    <section
      style={{
        background: BAND,
        borderRadius: 20,
        padding: "36px 28px",
        margin: "48px auto",
        maxWidth: 640,
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 999,
          background: CARD,
          marginBottom: 14,
        }}
      >
        <Mail className="h-5 w-5" style={{ color: GOLD }} />
      </div>

      <h2 style={{ fontFamily: SERIF, fontSize: 26, color: INK, margin: "0 0 8px", lineHeight: 1.3 }}>
        One verse. Every morning.
      </h2>
      <p style={{ color: BODY, fontSize: 15, lineHeight: 1.6, margin: "0 auto 22px", maxWidth: 440 }}>
        A short daily reading to keep the habit going — no commentary, no noise. Free, and you
        can unsubscribe any time.
      </p>

      {state === "done" ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: CARD,
            border: `2px solid ${GOLD}`,
            borderRadius: 12,
            padding: "14px 20px",
            color: INK,
            fontSize: 15,
          }}
        >
          <Check className="h-4 w-4" style={{ color: GOLD }} />
          {msg}
        </div>
      ) : (
        <form
          onSubmit={submit}
          style={{ display: "flex", gap: 10, maxWidth: 460, margin: "0 auto", flexWrap: "wrap" }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-label="Email address"
            style={{
              flex: "1 1 220px",
              padding: "13px 16px",
              borderRadius: 12,
              border: "1px solid rgba(34,28,20,0.16)",
              background: CARD,
              color: INK,
              fontSize: 15,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={state === "loading"}
            style={{
              padding: "13px 24px",
              borderRadius: 12,
              border: "none",
              background: state === "loading" ? GOLD_HOVER : GOLD,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: state === "loading" ? "wait" : "pointer",
              whiteSpace: "nowrap",
              transition: "background 0.15s",
            }}
          >
            {state === "loading" ? "Adding…" : "Send me the daily verse"}
          </button>
        </form>
      )}

      {state === "error" && (
        <p style={{ color: "#9B3B22", fontSize: 14, marginTop: 12 }}>{msg}</p>
      )}

      <p style={{ color: META, fontSize: 12.5, marginTop: 16 }}>
        We&rsquo;ll never share your address.
      </p>
    </section>
  );
}
