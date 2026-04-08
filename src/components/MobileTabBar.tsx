"use client"
import { useState, useEffect } from "react"
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

export default function MobileTabBar() {
  const pathname = usePathname()
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
  }, [])

  // Only show in Capacitor native app — use state so SSR never renders it
  if (!isNative) return null

  return (
    <nav
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
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
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
