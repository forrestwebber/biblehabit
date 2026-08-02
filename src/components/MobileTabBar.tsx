"use client"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Capacitor } from "@capacitor/core"

// Lucide outline icons, drawn inline: 22px, 1.5px stroke (1.9px active), currentColor.
const TABS = [
  {
    href: "/today",
    label: "Today",
    icon: (active: boolean) => (
      // sunrise
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" />
        <path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 6 4-4 4 4" />
        <path d="M16 18a4 4 0 0 0-8 0" />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Plan",
    icon: (active: boolean) => (
      // book-open
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: (active: boolean) => (
      // list
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" />
        <line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Settings",
    icon: (active: boolean) => (
      // settings
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
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
  // clearance gap, so page CTAs are never hidden behind the fixed bar.
  // Skipped on /plus, where the bar itself is not rendered — reserving padding
  // there leaves a stray dead band at the bottom of the paywall.
  useEffect(() => {
    if (!show || pathname === "/plus") return
    const root = document.documentElement

    const applyInsets = () => {
      const h = navRef.current?.offsetHeight ?? 64
      document.body.style.paddingBottom = `${h + CTA_CLEARANCE}px`
      root.style.setProperty("--bh-tabbar-h", `${h}px`)
    }

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
  }, [show, pathname])

  if (!show) return null

  // The paywall is a full-screen sheet — no tab bar.
  if (pathname === "/plus") return null

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
        background: "rgba(247, 242, 232, 0.86)",
        backdropFilter: "saturate(120%) blur(14px)",
        WebkitBackdropFilter: "saturate(120%) blur(14px)",
        borderTop: "1px solid var(--line-hairline, #E3D9C4)",
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
              color: active ? "var(--gold-700, #8F6716)" : "var(--text-muted, #8A7A64)",
              textDecoration: "none",
              transition: "color 0.2s",
              WebkitTapHighlightColor: "transparent",
              fontFamily: "var(--sans, Karla, sans-serif)",
            }}
          >
            {tab.icon(active)}
            <span style={{ fontSize: "10px", fontWeight: active ? 600 : 500, letterSpacing: "0.02em" }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
