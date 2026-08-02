"use client";
import { useEffect, useState } from "react";

interface SignUpGateProps {
  /** Current streak count to display */
  streak?: number;
  /** Callback when user dismisses without signing in */
  onDismiss: () => void;
}

export default function SignUpGate({ streak = 0, onDismiss }: SignUpGateProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-5 transition-all duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Scrim — ink-tinted, no blur */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(34,28,20,.32)" }}
        onClick={handleDismiss}
      />

      {/* Sheet */}
      <div
        className={`relative max-w-sm w-full transition-all duration-200 ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        style={{
          background: "var(--cream-50)",
          border: "1px solid var(--cream-300)",
          borderRadius: 28,
          boxShadow: "0 1px 2px rgba(34,28,20,.04), 0 18px 44px rgba(34,28,20,.16)",
          padding: 24,
        }}
      >
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute flex items-center justify-center"
          style={{ top: 16, right: 16, width: 32, height: 32, borderRadius: 999, background: "var(--cream-200)", color: "var(--ink-500)" }}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>

        {/* Sunrise mark */}
        <div className="flex justify-center" style={{ marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="" width={48} height={48} />
        </div>

        {streak > 0 && (
          <div className="flex justify-center" style={{ marginBottom: 14 }}>
            <span className="bh-chip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 6 4-4 4 4" /><path d="M16 18a4 4 0 0 0-8 0" /></svg>
              {streak} morning{streak === 1 ? "" : "s"} in a row
            </span>
          </div>
        )}

        <h2 className="bh-serif text-center" style={{ fontSize: 24, fontWeight: 500, marginBottom: 8, color: "var(--ink-900)" }}>
          Keep your place, everywhere
        </h2>

        <p className="text-center" style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-500)", marginBottom: 20 }}>
          Your mornings are kept on this device. Sign in and they quietly follow you to every screen you read on.
        </p>

        <div className="space-y-2">
          <a href="/login?mode=signup" className="bh-btn bh-btn-primary" style={{ textDecoration: "none" }}>
            Create a free account
          </a>
          <button onClick={handleDismiss} className="bh-btn bh-btn-quiet">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
