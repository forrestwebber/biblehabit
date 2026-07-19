import { supabaseAdmin } from "./admin";

/**
 * Verifies a Supabase access token (sent by the client from
 * `supabase.auth.getSession()`) against Supabase Auth and returns the
 * authenticated user. This is the server-side identity check for API
 * routes — BibleHabit's client SDK stores sessions in localStorage (no
 * SSR cookie session), so routes cannot read a session from cookies and
 * must verify the bearer token directly instead.
 */
export async function verifyUserFromRequest(
  req: Request
): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.email) return null;

  return { id: data.user.id, email: data.user.email };
}
