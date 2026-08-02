"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function NavBar() {
  const [user, setUser] = useState<{ email?: string; avatarUrl?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // In the native app the bottom tab bar carries navigation — no top site nav.
  useEffect(() => {
    setIsNative(
      typeof (window as any).Capacitor !== "undefined" &&
      !!(window as any).Capacitor.isNativePlatform?.()
    )
  }, [])

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

  if (isNative) return null

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
      <a href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-mark.svg" alt="" width={30} height={30} />
        <span className="bh-serif" style={{ fontSize: 22, fontWeight: 500, color: "var(--ink-900, #221C14)" }}>BibleHabit</span>
      </a>
      <div className="flex items-center gap-4">
        <a
          href="https://www.amazon.com/s?k=study+bible&tag=hookedtobooks-20"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="hidden sm:inline-flex items-center gap-1 rounded-full px-3 py-1.5"
          style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-500, #6B5C48)", border: "1px solid var(--cream-300, #E3D9C4)" }}
        >
          Get a physical Bible
        </a>
        {!loading && user && (
          <a href="/today" className="hidden sm:inline" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-500, #6B5C48)" }}>Today</a>
        )}
        {!loading && user ? (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)} title={user.email ?? "Account"}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover cursor-pointer transition" style={{ border: "2px solid var(--cream-400, #D6C9AE)" }} />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition" style={{ background: "var(--gold-100, #F8EED6)", color: "var(--gold-700, #8F6716)", border: "2px solid var(--cream-400, #D6C9AE)" }}>
                  {user.email?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl py-1 z-50" style={{ background: "var(--cream-50, #FCFAF4)", border: "1px solid var(--cream-300, #E3D9C4)", boxShadow: "0 1px 2px rgba(34,28,20,.04), 0 8px 22px rgba(34,28,20,.10)" }}>
                <p className="px-4 py-2 text-xs truncate" style={{ color: "var(--ink-400, #8A7A64)" }}>{user.email}</p>
                <hr style={{ borderColor: "var(--cream-200, #EFE7D6)" }} />
                <Link href="/today" className="block px-4 py-2 text-sm" style={{ color: "var(--ink-700, #463A2B)" }} onClick={() => setMenuOpen(false)}>Today</Link>
                <Link href="/dashboard" className="block px-4 py-2 text-sm" style={{ color: "var(--ink-700, #463A2B)" }} onClick={() => setMenuOpen(false)}>Plan</Link>
                <Link href="/progress" className="block px-4 py-2 text-sm" style={{ color: "var(--ink-700, #463A2B)" }} onClick={() => setMenuOpen(false)}>Progress</Link>
                <Link href="/profile" className="block px-4 py-2 text-sm" style={{ color: "var(--ink-700, #463A2B)" }} onClick={() => setMenuOpen(false)}>Settings</Link>
                <hr style={{ borderColor: "var(--cream-200, #EFE7D6)" }} />
                <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm" style={{ color: "var(--clay-500, #A4553C)" }}>Sign out</button>
              </div>
            )}
          </div>
        ) : !loading ? (
          <a href="/login" title="Sign in" className="block">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600 cursor-pointer transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
          </a>
        ) : null}
      </div>
    </nav>
  )
}
