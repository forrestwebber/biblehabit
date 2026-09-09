"use client";

/**
 * "Now on iPhone and iPad" — the App Store section.
 * BibleHabit App shipped to the App Store 2026-09-08 (id 6761791015).
 * Screenshots in /public/app are the exact ones on the store listing.
 */

const INK = "#221C14";
const BODY = "#5C5142";
const META = "#8A7F6E";
const LINK = "#8A6A1E";
const CARD = "#FFFDF8";
const BAND = "linear-gradient(180deg, #F4ECDA 0%, #EDE1C9 100%)";
const SERIF = "var(--font-serif)";

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/bible-habit-app/id6761791015";

export function AppStoreBadge({ className = "" }: { className?: string }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download BibleHabit on the App Store"
      className={`inline-block transition hover:opacity-85 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/app/app-store-badge.svg"
        alt="Download on the App Store"
        width={156}
        height={52}
        style={{ height: 52, width: "auto", display: "block" }}
      />
    </a>
  );
}

/** One phone: a hardware frame around a real App Store screenshot. */
function Phone({
  src,
  caption,
  raised = false,
}: {
  src: string;
  caption: string;
  raised?: boolean;
}) {
  return (
    <figure className="flex flex-col items-center" style={{ margin: 0 }}>
      <div
        className="relative"
        style={{
          width: raised ? 236 : 212,
          padding: 9,
          borderRadius: 42,
          background: "linear-gradient(160deg, #3B3227 0%, #221C14 46%, #4A4033 100%)",
          boxShadow: raised
            ? "0 40px 70px -34px rgba(34,28,20,0.62), 0 0 0 1px rgba(34,28,20,0.12)"
            : "0 26px 52px -30px rgba(34,28,20,0.5), 0 0 0 1px rgba(34,28,20,0.1)",
        }}
      >
        {/* Dynamic Island */}
        <div
          className="absolute left-1/2 z-10"
          style={{
            top: 20,
            transform: "translateX(-50%)",
            width: 62,
            height: 17,
            borderRadius: 12,
            background: "#15100B",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={caption}
          className="block w-full"
          style={{ borderRadius: 34, aspectRatio: "1290 / 2796", objectFit: "cover", objectPosition: "top" }}
          loading="lazy"
        />
      </div>
      <figcaption
        className="mt-5 text-sm text-center"
        style={{ color: META, maxWidth: 210 }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

export default function AppStoreSection() {
  return (
    <section
      id="ios-app"
      className="py-20 px-6"
      style={{
        background: BAND,
        borderTop: "1px solid rgba(34,28,20,0.05)",
        borderBottom: "1px solid rgba(34,28,20,0.05)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <p
            className="text-xs uppercase font-semibold mb-4"
            style={{ letterSpacing: "0.1em", color: LINK }}
          >
            New &mdash; on the App Store
          </p>
          <h2
            className="mb-4"
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(28px,3.6vw,40px)",
              color: INK,
              letterSpacing: "-0.015em",
            }}
          >
            BibleHabit is now on iPhone and iPad
          </h2>
          <p className="text-lg leading-relaxed mb-8" style={{ color: BODY }}>
            The same plan, the same streak, in your pocket. Your reading follows
            you across the app and the web &mdash; open either one and it picks up
            exactly where you left off.
          </p>
          <div className="flex flex-col items-center gap-3">
            <AppStoreBadge />
            <p className="text-xs" style={{ color: META }}>
              Free &middot; iPhone &amp; iPad &middot; requires iOS 15 or later
            </p>
          </div>
        </div>

        {/* The phones */}
        <div className="mt-16 flex items-end justify-center gap-6 md:gap-10 flex-wrap">
          <Phone
            src="/app/screen-plan-picker.png"
            caption="Tell it where you already are. It picks up mid-stream."
          />
          <Phone
            raised
            src="/app/screen-today.png"
            caption="One clear assignment each morning. Tap to mark it read."
          />
          <Phone
            src="/app/screen-progress.png"
            caption="A map of every morning you showed up."
          />
        </div>

        {/* What the app adds */}
        <div className="mt-16 grid md:grid-cols-3 gap-5">
          {[
            {
              title: "One tap from your home screen",
              desc: "No browser, no tab to hunt for. The icon opens straight to today's chapter.",
            },
            {
              title: "Built for the phone",
              desc: "Full screen, a Today / Progress / Profile tab bar, and a small haptic tap the moment you mark a chapter read.",
            },
            {
              title: "One account, both places",
              desc: "Sign in once. Phone, iPad and biblehabit.co all share the same streak.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl"
              style={{
                background: CARD,
                border: "1px solid rgba(34,28,20,0.06)",
                boxShadow: "0 12px 30px -20px rgba(34,28,20,0.3)",
              }}
            >
              <h3
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: SERIF, color: INK, letterSpacing: "-0.01em" }}
              >
                {f.title}
              </h3>
              <p className="leading-relaxed text-sm" style={{ color: BODY }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm" style={{ color: META }}>
          Prefer to read on a laptop?{" "}
          <a href="/welcome" style={{ color: LINK, textDecoration: "underline" }}>
            The web app is free too
          </a>{" "}
          &mdash; and it is the same account.
        </p>
      </div>
    </section>
  );
}
