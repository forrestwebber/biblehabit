"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function NavBar() {
  const [user, setUser] = useState<{ email?: string; avatarUrl?: string } | null>(null)
  const [loading, setLoading] = useState(true)

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
        <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-3 py-1 rounded-full">100% Free Forever</span>
        {!loading && user ? (
          <div className="flex items-center gap-3">
            <Link href="/profile" title={user.email ?? "Profile"}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" style={{ border: "2px solid rgba(139,92,246,0.4)" }} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "2px solid rgba(139,92,246,0.4)" }}>
                  {user.email?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg transition"
            >
              Sign out
            </button>
          </div>
        ) : !loading ? (
          <a href="/login" className="text-sm bg-violet-700 text-white px-4 py-2 rounded-lg hover:bg-violet-800 transition">Create Account</a>
        ) : null}
      </div>
    </nav>
  )
}
