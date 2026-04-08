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
    <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
      <a href="/" className="text-2xl font-bold text-slate-900">BibleHabit</a>
      <div className="flex items-center gap-4">
        <a
          href="https://www.amazon.com/s?k=study+bible&tag=hdsignals-20"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 transition font-medium border border-slate-200 hover:border-violet-300 rounded-full px-3 py-1.5"
        >
          <span>📖</span> Get a Physical Bible
        </a>
        {!loading && user && (
          <a href="/today" className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-violet-600 transition">Today</a>
        )}
        {!loading && user ? (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)} title={user.email ?? "Account"}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-violet-400 transition" style={{ border: "2px solid rgba(139,92,246,0.4)" }} />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:ring-2 hover:ring-violet-400 transition" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "2px solid rgba(139,92,246,0.4)" }}>
                  {user.email?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <p className="px-4 py-2 text-xs text-slate-400 truncate">{user.email}</p>
                <hr className="border-slate-100" />
                <Link href="/dashboard" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link href="/today" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Today</Link>
                <hr className="border-slate-100" />
                <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
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
