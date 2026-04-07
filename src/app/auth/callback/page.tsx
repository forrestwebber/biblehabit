"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackContent() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/dashboard";
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        window.location.href = error ? "/login?error=auth_callback_failed" : next;
      });
    } else {
      supabase.auth.getSession().then(({ data }) => {
        window.location.href = data.session ? next : "/login";
      });
    }
  }, [searchParams]);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400">Loading…</div></div>}>
      <CallbackContent />
    </Suspense>
  );
}
