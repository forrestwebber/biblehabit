"use client";
import { useState, useEffect } from "react";
import { queuePush } from "@/lib/cloud-state";
import NavBar from "@/components/NavBar";
import { TrialRow } from "@/components/TrialBanner";
import { useEntitlement, authHeaders } from "@/lib/use-entitlement";
import { supabase } from "@/lib/supabase";
import {
  getReminderEnabled, setReminderEnabled,
  getReminderTime, setReminderTime, REMINDER_TIMES, formatReminderTime,
} from "@/lib/prefs";

const TRANSLATIONS = [
  { id: "kjv", label: "KJV", name: "King James Version", note: "public domain" },
  { id: "niv", label: "NIV", name: "New International Version", note: "" },
  { id: "esv", label: "ESV", name: "English Standard Version", note: "" },
  { id: "nkjv", label: "NKJV", name: "New King James Version", note: "" },
  { id: "nlt", label: "NLT", name: "New Living Translation", note: "" },
  { id: "web", label: "WEB", name: "World English Bible", note: "public domain" },
  { id: "asv", label: "ASV", name: "American Standard Version", note: "public domain" },
  { id: "bbe", label: "BBE", name: "Bible in Basic English", note: "public domain" },
];
const TRANSLATION_STORAGE_KEY = "biblehabit_translation";

function formatRenewal(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const BookOpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

export default function SettingsPage() {
  // Entitlement drives the trial row and the subscription card.
  const { ent, pro, isNative: entNative, refresh: refreshEntitlement } = useEntitlement();

  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNative, setIsNative] = useState(false);

  const [reminderOn, setReminderOn] = useState(true);
  const [reminderTime, setReminderTimeState] = useState("7:00");
  const [translation, setTranslation] = useState("kjv");
  const [showTranslations, setShowTranslations] = useState(false);

  useEffect(() => {
    setReminderOn(getReminderEnabled());
    setReminderTimeState(getReminderTime());
    setTranslation(localStorage.getItem(TRANSLATION_STORAGE_KEY) ?? "kjv");
    setIsNative(
      typeof (window as any).Capacitor !== "undefined" &&
      !!(window as any).Capacitor.isNativePlatform?.()
    );

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        setUser({
          email: u.email ?? undefined,
          name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? undefined,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleToggleReminder = () => {
    if (!pro) return; // the daily reminder is a Pro feature
    const next = !reminderOn;
    setReminderOn(next);
    setReminderEnabled(next);
  };

  const handleTime = (t: string) => {
    setReminderTimeState(t);
    setReminderTime(t);
  };

  const handleTranslation = (id: string) => {
    setTranslation(id);
    localStorage.setItem(TRANSLATION_STORAGE_KEY, id);
    queuePush(TRANSLATION_STORAGE_KEY);
    setShowTranslations(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleManageBilling = async () => {
    if (!user?.email) return;
    const res = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ email: user.email }),
    });
    if (res.ok) {
      const { url } = await res.json();
      if (url) window.location.href = url;
    }
  };

  const currentTranslation = TRANSLATIONS.find((t) => t.id === translation) ?? TRANSLATIONS[0];
  const initial = (user?.name ?? user?.email ?? "?").charAt(0).toUpperCase();

  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" };
  const hairline: React.CSSProperties = { borderTop: "1px solid var(--line-hairline)" };

  return (
    <div className="bh-app">
      <NavBar />
      <div className="max-w-2xl mx-auto" style={{ padding: "20px 20px 28px" }}>
        <h1 className="bh-serif" style={{ fontSize: 30, fontWeight: 500, marginBottom: 20 }}>Settings</h1>

        <div className="space-y-4">

          {/* Group 1 — daily note + translation */}
          <div className="bh-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={rowStyle}>
              <span style={{ color: "var(--text-muted)" }}><BellIcon /></span>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 15, fontWeight: 500 }}>Daily note</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>
                  {!pro
                    ? "Part of Pro — the reading still waits for you"
                    : reminderOn
                      ? `One quiet note at ${formatReminderTime(reminderTime)}, never a catch-up`
                      : "No note — the reading still waits for you"}
                </p>
              </div>
              {/* Switch */}
              <button
                onClick={handleToggleReminder}
                role="switch"
                aria-checked={reminderOn && pro}
                disabled={!pro}
                style={{
                  width: 50, height: 30, borderRadius: 999, flexShrink: 0,
                  opacity: pro ? 1 : 0.45,
                  background: reminderOn && pro ? "var(--gold-500)" : "var(--cream-400)",
                  position: "relative",
                  transition: "background 280ms var(--ease-bh)",
                }}
              >
                <span
                  style={{
                    position: "absolute", top: 3, left: reminderOn && pro ? 23 : 3,
                    width: 24, height: 24, borderRadius: 999, background: "#FFFDF7",
                    boxShadow: "0 1px 3px rgba(34,28,20,.2)",
                    transition: "left 280ms var(--ease-bh)",
                  }}
                />
              </button>
            </div>
            {reminderOn && pro && (
              <div className="flex flex-wrap gap-2" style={{ padding: "0 16px 14px 46px" }}>
                {REMINDER_TIMES.map((t) => {
                  const selected = reminderTime === t;
                  return (
                    <button
                      key={t}
                      onClick={() => handleTime(t)}
                      style={{
                        height: 36, padding: "0 14px", borderRadius: 999,
                        fontSize: 13, fontWeight: 600,
                        border: `1.5px solid ${selected ? "var(--gold-500)" : "var(--line-strong)"}`,
                        background: selected ? "var(--gold-100)" : "transparent",
                        color: selected ? "var(--gold-700)" : "var(--text-secondary)",
                        transition: "border-color 200ms, background 200ms",
                      }}
                    >
                      {formatReminderTime(t)}
                    </button>
                  );
                })}
              </div>
            )}
            <button className="w-full text-left" style={{ ...rowStyle, ...hairline }} onClick={() => setShowTranslations((v) => !v)}>
              <span style={{ color: "var(--text-muted)" }}><BookOpenIcon /></span>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 15, fontWeight: 500 }}>Translation</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>
                  {currentTranslation.name}{currentTranslation.note ? ` · ${currentTranslation.note}` : ""}
                </p>
              </div>
              <span style={{ color: "var(--text-muted)", transform: showTranslations ? "rotate(90deg)" : "none", transition: "transform 280ms" }}><ChevronRightIcon /></span>
            </button>
            {showTranslations && (
              <div className="bh-fade" style={{ padding: "0 16px 14px 46px" }}>
                {TRANSLATIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTranslation(t.id)}
                    className="w-full text-left flex items-center justify-between"
                    style={{ padding: "9px 0", fontSize: 14, color: t.id === translation ? "var(--gold-700)" : "var(--text-secondary)", fontWeight: t.id === translation ? 600 : 400 }}
                  >
                    <span>{t.name}</span>
                    {t.id === translation && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account */}
          {!loading && (user ? (
            <div className="bh-card flex items-center gap-3" style={{ padding: 16 }}>
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 46, height: 46, borderRadius: 999, background: "var(--gold-100)" }}>
                <span className="bh-serif" style={{ fontSize: 19, fontWeight: 500, color: "var(--gold-700)" }}>{initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                {user.name && <p style={{ fontSize: 15, fontWeight: 500 }}>{user.name}</p>}
                <p className="truncate" style={{ fontSize: user.name ? 13 : 15, color: user.name ? "var(--text-muted)" : "var(--text-body)" }}>{user.email}</p>
              </div>
            </div>
          ) : (
            <a href="/login?mode=signin" className="bh-card flex items-center justify-between" style={{ padding: 16, textDecoration: "none", color: "inherit" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500 }}>Sign in</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>Your reading follows you to every device</p>
              </div>
              <span style={{ color: "var(--text-muted)" }}><ChevronRightIcon /></span>
            </a>
          ))}

          {/* Reading plan — the manual override (position + pace). Discoverable
              from Settings as well as the Plan tab: someone who read ahead in a
              paper Bible looks for it here first. */}
          <a href="/plan/edit" className="bh-card flex items-center justify-between" style={{ padding: 16, textDecoration: "none", color: "inherit" }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 500 }}>My reading plan</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>Change your pace, or set where you actually are</p>
            </div>
            <span style={{ color: "var(--text-muted)" }}><ChevronRightIcon /></span>
          </a>

          {/* Subscription — trial state, then paid state */}
          <div className="bh-card" style={{ padding: 16 }}>
            <div className="flex items-center justify-between gap-3" style={{ marginBottom: 12 }}>
              <div className="min-w-0">
                <p style={{ fontSize: 15, fontWeight: 500 }}>BibleHabit Plus</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>
                  {!ent
                    ? "Checking…"
                    : ent.comped
                      ? "Complimentary access"
                      : ent.isPaid
                        ? `${ent.interval === "month" ? "Monthly" : "Yearly"}${ent.currentPeriodEnd ? ` · renews ${formatRenewal(ent.currentPeriodEnd)}` : ""}`
                        : ent.status === "trialing"
                          ? "Full access during your free trial"
                          : "Your 7-day trial has ended — scripture stays free"}
                </p>
              </div>
              {ent?.isPaid ? (
                <span className="flex-shrink-0" style={{ background: "var(--sage-100)", color: "var(--sage-700)", fontSize: 12, fontWeight: 600, borderRadius: 999, padding: "4px 12px" }}>
                  Active
                </span>
              ) : ent ? (
                <TrialRow daysLeft={ent.daysLeft} ended={ent.status === "expired"} />
              ) : null}
            </div>

            {ent?.isPaid ? (
              isNative || entNative ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Manage your subscription where you purchased it.</p>
              ) : ent.comped ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No billing on this account.</p>
              ) : (
                <button onClick={handleManageBilling} className="bh-btn bh-btn-secondary" style={{ height: 44, fontSize: 14 }}>
                  Manage subscription
                </button>
              )
            ) : isNative || entNative ? (
              /* App Store 3.1.1 — no prices, no purchase CTA, no links out. */
              <div>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-muted)" }}>
                  Subscriptions are coming to the App Store. If you already subscribed on the web,
                  sign in with that account to continue.
                </p>
                <button onClick={refreshEntitlement} className="bh-btn bh-btn-secondary" style={{ height: 44, fontSize: 14, marginTop: 10 }}>
                  Check my subscription again
                </button>
              </div>
            ) : (
              <a href="/plus" className="bh-btn bh-btn-secondary" style={{ height: 44, fontSize: 14 }}>
                {ent?.status === "expired" ? "See BibleHabit Plus" : "See what's in Plus"}
              </a>
            )}
          </div>

          {/* Sign out */}
          {user && (
            <button onClick={handleSignOut} className="bh-card w-full flex items-center justify-between" style={{ padding: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Sign out</span>
              <span style={{ color: "var(--text-muted)" }}><ChevronRightIcon /></span>
            </button>
          )}

          <p className="text-center" style={{ fontSize: 13, color: "var(--text-muted)", paddingTop: 8 }}>
            Scripture in the King James Version is public domain
          </p>
        </div>
      </div>
    </div>
  );
}
