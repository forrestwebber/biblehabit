/**
 * Supabase configuration for BibleHabit.
 *
 * Hardcoded to prevent Vercel env var conflicts with other projects
 * (e.g., DailyGames) that share the same Vercel team/project link.
 * The anon key is a public key — safe to commit.
 */
export const SUPABASE_URL = "https://lenluazxrudhlggliuno.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbmx1YXp4cnVkaGxnZ2xpdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjQxNTcsImV4cCI6MjA5MDQwMDE1N30.AisVYFp14GM83oZi-BKetoRiL0FOMn6xrAcDKx10ywk";
