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
      <div className="flex items-center gap-2">
        {!loading && user ? (
          <Link href="/profile" title={user.email ?? "Profile"}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-violet-400 transition" style={{ border: "2px solid rgba(139,92,246,0.4)" }} />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:ring-2 hover:ring-violet-400 transition" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "2px solid rgba(139,92,246,0.4)" }}>
                {user.email?.charAt(0).toUpperCase() ?? "?"}
              </div>
            )}
          </Link>
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
