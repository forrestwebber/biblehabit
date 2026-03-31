/**
 * Supabase configuration for BibleHabit.
 *
 * Uses the shared Supabase project (btqgccvuoupdiovfcgnn) which has
 * working Google OAuth configured. Hardcoded to prevent Vercel env var
 * conflicts across projects. The anon key is a public key — safe to commit.
 *
 * NOTE: The Supabase dashboard for this project must include
 * https://biblehabit.vercel.app in its Auth > URL Configuration > Redirect URLs.
 */
export const SUPABASE_URL = "https://btqgccvuoupdiovfcgnn.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cWdjY3Z1b3VwZGlvdmZjZ25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTM1NjcsImV4cCI6MjA4ODkyOTU2N30.THejHRMPWYDPjnFxeDJGuzc7XJxp1To56dezoSe1i_Y";
