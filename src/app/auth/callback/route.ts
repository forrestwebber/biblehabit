import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../../lib/supabase-config";

/**
 * OAuth callback handler.
 * After Supabase redirects back with a code, this route exchanges it for a session.
 * For client-side auth flow, Supabase handles the token exchange via the hash fragment.
 * This route handles the PKCE flow (code exchange) for server-side.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/today";

  if (code) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
