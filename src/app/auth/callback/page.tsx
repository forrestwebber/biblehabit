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
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "#F7F2E8" }}>
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid #C9962E", borderTopColor: "transparent" }} />
      <p className="text-sm" style={{ color: "#8A7F6E" }}>Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F2E8" }}><div style={{ color: "#8A7F6E" }}>Loading…</div></div>}>
      <CallbackContent />
    </Suspense>
  );
}
