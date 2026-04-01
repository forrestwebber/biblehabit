import { NextResponse } from "next/server";
import { PREDEFINED_PLANS } from "@/lib/predefined-plans";

export async function GET() {
  return NextResponse.json({
    plans: PREDEFINED_PLANS.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      versesPerDay: p.versesPerDay,
      durationDays: p.durationDays,
      category: p.category,
    })),
  });
}
