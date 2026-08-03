import { NextRequest, NextResponse } from "next/server";
import { requireEntitlement, isPro } from "@/lib/entitlement";
import { getFreePlan } from "@/lib/predefined-plans";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Saving / changing a reading plan.
 *
 * The client used to write profiles directly with the anon key; it posts here
 * instead so the tier is enforced server-side. The profiles UPDATE policy
 * (bh_is_entitled) is the second lock: even a hand-rolled request with a valid
 * user token cannot write plan data.
 *
 * TIER RULE (2026-08-03): choosing a plan or a pace is Pro. A free-tier account
 * may still POST, but only the exact fixed year plan — that is how free accounts
 * get their plan assigned at signup without needing a separate privileged path.
 * Anything else from a free caller is a 402 `pro_required`.
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

  // Free tier: the fixed year plan and nothing else. Compared field by field
  // rather than by slug, because the slug never reaches the database — only
  // these three values do, so these are what a bypass attempt would have to
  // forge. startDate stays free: WHEN you begin isn't customization.
  if (!isPro(gate.ent)) {
    const free = getFreePlan();
    const matchesFreePlan =
      startBook === free.startBook &&
      startChapter === free.startChapter &&
      chaptersPerDay === free.versesPerDay;
    if (!matchesFreePlan) {
      return NextResponse.json(
        {
          error: "BibleHabit Pro is required to choose your own plan or pace",
          code: "pro_required",
          tier: gate.ent.tier,
        },
        { status: 402 }
      );
    }
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
