"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function NavBar() {
  const [user, setUser] = useState<{ email?: string; avatarUrl?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser({
          email: data.session.user.email ?? undefined,
          avatarUrl: data.session.user.user_metadata?.avatar_url ?? undefined,
        })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email ?? undefined,
          avatarUrl: session.user.user_metadata?.avatar_url ?? undefined,
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = "/"
  }

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{ background: "rgba(247,242,232,0.82)", borderBottom: "1px solid rgba(34,28,20,0.06)", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <a href="/" className="flex items-center gap-2.5">
          <span
            className="inline-block w-7 h-7 rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 68%, #F2D793 0%, #C9962E 58%, #A97C1E 100%)",
              boxShadow: "0 0 0 4px rgba(201,150,46,0.14)",
            }}
          />
          <span className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "#221C14", letterSpacing: "-0.01em" }}>
            BibleHabit
          </span>
        </a>
        <div className="flex items-center gap-4">
          {/* Design handoff: four in-page anchors, hidden below 820px (no hamburger
              was designed — mobile relies on scrolling the single page). */}
          <div className="bh-nav-links flex items-center" style={{ gap: "clamp(14px, 2.6vw, 32px)" }}>
            {[
              ["How it works", "/#how"],
              ["Goals", "/#goals"],
              ["Gentle by design", "/#gentle"],
              ["Pricing", "/#pricing"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="transition whitespace-nowrap"
                style={{ fontSize: 15, fontWeight: 500, color: "#5C5142" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#8A6A1E" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#5C5142" }}
              >
                {label}
              </a>
            ))}
          </div>
          {!loading && !user && (
            <a
              href="/welcome"
              className="transition whitespace-nowrap"
              style={{ background: "#C9962E", color: "#221C14", fontSize: 15, fontWeight: 600, padding: "10px 18px", borderRadius: 999, boxShadow: "0 2px 10px rgba(201,150,46,0.32)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#B9861F" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#C9962E" }}
            >
              Start free
            </a>
          )}
          {!loading && user && (
            <a href="/today" className="hidden sm:inline text-sm font-medium transition" style={{ color: "#5A4F3F" }}>
              Today
            </a>
          )}
          {!loading && user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(v => !v)} title={user.email ?? "Account"}>
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover cursor-pointer transition"
                    style={{ border: "2px solid rgba(201,150,46,0.35)" }}
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition"
                    style={{
                      background: "radial-gradient(circle at 50% 68%, #F2D793 0%, #C9962E 58%, #A97C1E 100%)",
                      color: "#221C14",
                      border: "2px solid rgba(201,150,46,0.35)",
                    }}
                  >
                    {user.email?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl py-1 z-50"
                  style={{ background: "#FFFDF8", border: "1px solid rgba(34,28,20,0.08)", boxShadow: "0 16px 40px -24px rgba(34,28,20,0.4)" }}
                >
                  <p className="px-4 py-2 text-xs truncate" style={{ color: "#8A7F6E" }}>{user.email}</p>
                  <hr style={{ borderColor: "rgba(34,28,20,0.08)" }} />
                  <Link href="/dashboard" className="block px-4 py-2 text-sm transition" style={{ color: "#3A3226" }} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <Link href="/today" className="block px-4 py-2 text-sm transition" style={{ color: "#3A3226" }} onClick={() => setMenuOpen(false)}>Today</Link>
                  <Link href="/profile" className="block px-4 py-2 text-sm transition" style={{ color: "#3A3226" }} onClick={() => setMenuOpen(false)}>Plan &amp; Billing</Link>
                  <hr style={{ borderColor: "rgba(34,28,20,0.08)" }} />
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl">Sign Out</button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <a href="/login" title="Sign in" className="block">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition"
                style={{ color: "#8A7F6E", background: "#F2E9D6" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
            </a>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
