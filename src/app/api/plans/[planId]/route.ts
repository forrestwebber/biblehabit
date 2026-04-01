import { NextRequest, NextResponse } from "next/server";
import { getPlanById, PREDEFINED_PLANS } from "@/lib/predefined-plans";
import { generateSchedule } from "@/lib/schedule-generator";

// In-memory cache: planId → { data, expires }
const cache = new Map<
  number,
  { data: object; expires: number }
>();

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId: rawId } = await params;
  const planId = parseInt(rawId, 10);

  // List all plans if no valid ID
  if (isNaN(planId)) {
    return NextResponse.json(
      {
        error: "Invalid plan ID. Must be a number.",
        availablePlans: PREDEFINED_PLANS.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          description: p.description,
        })),
      },
      { status: 400 }
    );
  }

  const plan = getPlanById(planId);
  if (!plan) {
    return NextResponse.json(
      {
        error: `Plan ${planId} not found.`,
        availablePlans: PREDEFINED_PLANS.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
        })),
      },
      { status: 404 }
    );
  }

  // Check cache
  const now = Date.now();
  const cached = cache.get(planId);
  if (cached && cached.expires > now) {
    return NextResponse.json(cached.data, {
      headers: {
        "X-Cache": "HIT",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Generate schedule starting from today
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const schedule = generateSchedule(plan, startDate);

  const responseData = {
    plan: {
      id: plan.id,
      slug: plan.slug,
      title: plan.title,
      description: plan.description,
      versesPerDay: plan.versesPerDay,
      startDate: startDate.toISOString().split("T")[0],
      durationDays: plan.durationDays,
      category: plan.category,
    },
    schedule,
    meta: {
      totalDays: schedule.length,
      generatedAt: new Date().toISOString(),
    },
  };

  // Store in cache
  cache.set(planId, { data: responseData, expires: now + CACHE_TTL });

  return NextResponse.json(responseData, {
    headers: {
      "X-Cache": "MISS",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
