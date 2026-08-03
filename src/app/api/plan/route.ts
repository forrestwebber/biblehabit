import { NextRequest, NextResponse } from "next/server";
import { requireEntitlement } from "@/lib/entitlement";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Saving / changing a reading plan — a gated product action.
 *
 * The client used to write profiles directly with the anon key. It now posts
 * here so plan creation and plan changes fail loudly with 402 once the trial
 * has ended. The profiles UPDATE policy (bh_is_entitled) is the second lock:
 * even a hand-rolled request with a valid user token cannot write plan data.
 */
export async function POST(req: NextRequest) {
  const gate = await requireEntitlement(req);
  if ("response" in gate) return gate.response;

  let body: {
    startBook?: string;
    startChapter?: number;
    chaptersPerDay?: number;
    startDate?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { startBook, startChapter, chaptersPerDay, startDate } = body;
  if (!startBook || typeof startChapter !== "number" || typeof chaptersPerDay !== "number") {
    return NextResponse.json({ error: "Missing plan fields" }, { status: 400 });
  }
  if (chaptersPerDay < 1 || chaptersPerDay > 100 || startChapter < 1) {
    return NextResponse.json({ error: "Plan out of range" }, { status: 400 });
  }
  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      plan_id: `${startBook}-${startChapter}`,
      plan_start_date: startDate ?? null,
      chapters_per_day: chaptersPerDay,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gate.user.id);

  if (error) {
    console.error("[api/plan] profile update failed:", error);
    return NextResponse.json({ error: "Could not save plan" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
