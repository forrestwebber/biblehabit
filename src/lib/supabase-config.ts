/**
 * Supabase configuration for BibleHabit.
 *
 * Uses BibleHabit's own Supabase project (lenluazxrudhlggliuno).
 * Reads from env vars with hardcoded fallback. The anon key is a public key — safe to commit.
 *
 * NOTE: The Supabase dashboard for this project must include
 * https://biblehabit.co/auth/callback in its Auth > URL Configuration > Redirect URLs.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lenluazxrudhlggliuno.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbmx1YXp4cnVkaGxnZ2xpdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjQxNTcsImV4cCI6MjA5MDQwMDE1N30.AisVYFp14GM83oZi-BKetoRiL0FOMn6xrAcDKx10ywk";
