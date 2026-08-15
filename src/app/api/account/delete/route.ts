import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Guideline 5.1.1(v): full in-app account deletion. Removes the user's rows and
// the auth user itself — not a deactivation. The caller must present their own
// access token; the service role does the deleting only after that token
// resolves to a real user.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const uid = userData.user.id;

  // User-owned rows first, then the auth user. Table list mirrors every
  // from("...") in this codebase that is keyed by user id.
  const tables = ["reading_progress", "user_state", "subscriptions", "profiles"];
  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).delete().eq("user_id", uid);
    if (error && !/does not exist/i.test(error.message)) {
      // profiles keys on id in some schemas — retry once with id
      await supabaseAdmin.from(table).delete().eq("id", uid);
    }
  }

  const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(uid);
  if (delErr) {
    return NextResponse.json({ error: "Deletion failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
