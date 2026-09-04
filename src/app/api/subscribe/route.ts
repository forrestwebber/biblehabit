import { NextResponse } from "next/server";

/**
 * BibleHabit daily-verse email capture.
 *
 * Built 2026-07-30. BibleHabit had NO email capture of any kind — /welcome creates a
 * Supabase product account and nothing ever wrote to Kit, which is why Kit tag 21490215
 * sat at 0 subscribers. As of 7/31 the new Facebook page starts driving daily traffic
 * here, so without this every one of those visitors leaked.
 *
 * Kit is the list of record; Supabase `leads` is a local mirror so a Kit outage can
 * never lose an address. Signup succeeds if EITHER durable sink captured it — one dead
 * token must not turn subscribers away. Modeled on the proven phileosophia.com route.
 */

const KIT_TAG_ID = "21490215"; // "biblehabit"
const KIT_API_URL = "https://api.kit.com/v4";

async function addToKit(email: string): Promise<boolean> {
  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    console.error("KIT_API_KEY not set — skipping Kit");
    return false;
  }
  const headers = { "X-Kit-Api-Key": apiKey, "Content-Type": "application/json" };

  const subRes = await fetch(`${KIT_API_URL}/subscribers`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email_address: email }),
  });
  if (!subRes.ok) {
    console.error("Kit subscriber create failed:", subRes.status, await subRes.text());
    return false;
  }

  // Tagging is what actually makes them mailable — the daily send targets the tag,
  // so an untagged subscriber silently never receives anything.
  const tagRes = await fetch(`${KIT_API_URL}/tags/${KIT_TAG_ID}/subscribers`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email_address: email }),
  });
  if (!tagRes.ok) {
    console.error("Kit tag failed:", tagRes.status, await tagRes.text());
    return false; // deliberately NOT a success — an untagged subscriber is a lost one
  }
  return true;
}

async function addToSupabase(email: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([{ email, source: "biblehabit-daily-verse" }]),
    });
    return res.ok;
  } catch (e) {
    console.error("Supabase lead insert failed:", e);
    return false;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = (body.email || "").trim().toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const [kitOk, dbOk] = await Promise.all([
    addToKit(email).catch((e) => {
      console.error("Kit error:", e);
      return false;
    }),
    addToSupabase(email).catch(() => false),
  ]);

  if (!kitOk && !dbOk) {
    return NextResponse.json({ error: "Something went wrong — please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "You're in. Check your inbox tomorrow morning." });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "BibleHabit subscribe endpoint. POST { email }.",
  });
}
