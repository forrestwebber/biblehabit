"use client"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Capacitor } from "@capacitor/core"

const TABS = [
  {
    href: "/today",
    label: "Today",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        {active && <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeWidth={3}/>}
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Progress",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

// Gap reserved between the last scrollable element and the top of the tab bar.
const CTA_CLEARANCE = 24

export default function MobileTabBar() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  // Decide visibility on the client only, so SSR markup never includes the bar
  // (avoids hydration mismatch). Shown in the Capacitor native app, and in a
  // browser when `?tabbar=preview` is present (for QA / screenshots).
  useEffect(() => {
    const preview =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("tabbar") === "preview"
    setShow(Capacitor.isNativePlatform() || preview)
  }, [])

  // Reserve real flow space equal to the *measured* bar height (which already
  // includes the device safe-area inset via the .bh-tabbar CSS rule) plus a
  // clearance gap, so page CTAs are never hidden behind the fixed bar. Using a
  // measured pixel value — instead of a hard-coded guess — self-adjusts to font
  // scaling and the home-indicator inset on every device. Also exposes the bar
  // height as a CSS var so floating UI (chat FAB, verse toolbar) can sit above
  // the bar too.
  useEffect(() => {
    if (!show) return
    const root = document.documentElement

    const applyInsets = () => {
      const h = navRef.current?.offsetHeight ?? 64
      document.body.style.paddingBottom = `${h + CTA_CLEARANCE}px`
      root.style.setProperty("--bh-tabbar-h", `${h}px`)
    }

    // Measure now, again on the next frame (lets env() safe-area resolve in the
    // native webview), and on any resize / orientation change.
    applyInsets()
    const raf = requestAnimationFrame(applyInsets)
    window.addEventListener("resize", applyInsets)
    window.addEventListener("orientationchange", applyInsets)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", applyInsets)
      window.removeEventListener("orientationchange", applyInsets)
      document.body.style.paddingBottom = ""
      root.style.removeProperty("--bh-tabbar-h")
    }
  }, [show])

  if (!show) return null

  return (
    <nav
      ref={navRef}
      className="bh-tabbar"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(15, 10, 30, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(124, 58, 237, 0.2)",
        display: "flex",
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href === "/today" && pathname === "/")
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "10px",
              paddingBottom: "10px",
              gap: "4px",
              minHeight: "48px",
              color: active ? "#a78bfa" : "#64748b",
              textDecoration: "none",
              transition: "color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {tab.icon(active)}
            <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, letterSpacing: "0.02em" }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
