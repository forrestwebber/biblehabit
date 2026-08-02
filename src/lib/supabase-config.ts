/**
 * Supabase configuration for BibleHabit.
 *
 * Uses BibleHabit's Supabase project (sjpvmvullpzimcgmhhxk).
 * Reads from env vars with hardcoded fallback. The anon key is a public key — safe to commit.
 *
 * NOTE: The Supabase dashboard for this project must include
 * https://biblehabit.co/auth/callback in its Auth > URL Configuration > Redirect URLs.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://sjpvmvullpzimcgmhhxk.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcHZtdnVsbHB6aW1jZ21oaHhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NzI5MjQsImV4cCI6MjEwMDA0ODkyNH0.P89e8Xqbfz3vNHSVTdDFE80phrjzNMRzxizpvQFzsJw";
