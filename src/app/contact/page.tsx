"use client";

/**
 * /contact — the footer's Contact destination.
 *
 * The design handoff is explicit that Contact must NOT be a mailto: link, and so is the
 * house rule. This posts to the existing /api/feedback route (Resend -> hello@biblehabit.co),
 * with the sender's email carried in the body so a reply is possible.
 */

import { useState } from "react";
import NavBar from "@/components/NavBar";

const INK = "#221C14";
const BODY = "#5C5142";
const META = "#8A7F6E";
const GOLD = "#C9962E";
const LINK = "#8A6A1E";
const CARD = "#FFFDF8";
const PARCHMENT = "#F7F2E8";
const SERIF = "var(--font-serif)";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: "BibleHabit — contact form",
          feedback: `From: ${email}\n\n${message}`,
          timestamp: new Date().toISOString(),
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div style={{ background: PARCHMENT, color: INK, minHeight: "100vh" }}>
      <NavBar />
      <main
        className="mx-auto w-full"
        style={{ maxWidth: 640, paddingLeft: "clamp(20px,5vw,44px)", paddingRight: "clamp(20px,5vw,44px)", paddingTop: "clamp(48px,7vw,88px)", paddingBottom: "clamp(56px,8vw,104px)" }}
      >
        <p className="uppercase" style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", color: GOLD, marginBottom: 14 }}>
          Contact
        </p>
        <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(30px,4vw,44px)", lineHeight: 1.1, letterSpacing: "-0.015em", marginBottom: 16 }}>
          Say hello.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: BODY, marginBottom: 34 }}>
          Questions about a reading plan, a billing problem, or something that broke — write it
          here and it lands in our inbox. We read everything.
        </p>

        {state === "sent" ? (
          <div style={{ background: "#EFF3E8", border: "1.5px solid #CBD9B4", borderRadius: 16, padding: 28 }}>
            <p style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: "#3A5B2E", marginBottom: 8 }}>Got it — thank you.</p>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "#4C5A3B" }}>
              We&apos;ll reply to <strong>{email}</strong>. In the meantime,{" "}
              <a href="/today" style={{ color: LINK, textDecoration: "underline" }}>today&apos;s reading</a> is waiting.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ background: CARD, border: "1px solid rgba(34,28,20,0.06)", borderRadius: 20, padding: "clamp(24px,3vw,34px)", boxShadow: "0 12px 30px -20px rgba(34,28,20,0.3)" }}>
            <label htmlFor="contact-email" style={{ display: "block", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: META, marginBottom: 8 }}>
              Your email
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", borderRadius: 13, border: "1.5px solid rgba(34,28,20,0.14)", background: PARCHMENT, padding: "13px 16px", fontSize: 16, color: INK, marginBottom: 22 }}
            />

            <label htmlFor="contact-message" style={{ display: "block", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: META, marginBottom: 8 }}>
              Message
            </label>
            <textarea
              id="contact-message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              style={{ width: "100%", borderRadius: 13, border: "1.5px solid rgba(34,28,20,0.14)", background: PARCHMENT, padding: "13px 16px", fontSize: 16, lineHeight: 1.6, color: INK, marginBottom: 22, resize: "vertical" }}
            />

            <button
              type="submit"
              disabled={state === "sending"}
              className="w-full transition"
              style={{ background: GOLD, color: INK, borderRadius: 13, padding: 14, fontWeight: 700, fontSize: 16, boxShadow: "0 8px 22px -8px rgba(201,150,46,0.7)", opacity: state === "sending" ? 0.65 : 1 }}
            >
              {state === "sending" ? "Sending…" : "Send message"}
            </button>

            {state === "error" && (
              <p style={{ fontSize: 14, color: "#8A3A2E", marginTop: 14 }}>
                That didn&apos;t go through. Try again in a moment.
              </p>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
