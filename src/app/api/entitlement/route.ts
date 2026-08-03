import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getEntitlement } from "@/lib/entitlement";

export const dynamic = "force-dynamic";

/**
 * The only place the client learns whether it is entitled — and it is
 * advisory for UI purposes only. Every write path is independently gated
 * (API routes via requireEntitlement, the database via bh_is_entitled in
 * RLS), so a tampered client response grants nothing.
 *
 * Requires `Authorization: Bearer <supabase access token>`.
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 200, headers: noStore });
  }

  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  const ent = await getEntitlement(user, { fresh });

  return NextResponse.json({ authenticated: true, email: user.email, ...ent }, { headers: noStore });
}

const noStore = { "Cache-Control": "no-store, max-age=0" };
