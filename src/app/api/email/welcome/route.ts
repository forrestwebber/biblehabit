import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, name, startBook, startChapter, chaptersPerDay, finishDate } = await req.json();
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const displayName = name ? name.split(" ")[0] : "friend";
    const pace = chaptersPerDay === 1 ? "1 chapter" : `${chaptersPerDay} chapters`;
    const startLabel = startChapter > 1 ? `${startBook} ${startChapter}` : startBook;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">BibleHabit</h1>
          <p style="margin:8px 0 0;color:#c4b5fd;font-size:14px;">Your reading plan is set</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 20px;font-size:18px;color:#1e293b;font-weight:600;">Hey ${displayName} 👋</p>
          <p style="margin:0 0 20px;font-size:16px;color:#475569;line-height:1.6;">
            Your reading plan starts <strong>today</strong>. Here's what you're working with:
          </p>

          <!-- Plan card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;margin:0 0 28px;">
            <tr><td style="padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#7c3aed;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Starting from</td>
                  <td align="right" style="padding:6px 0;color:#1e293b;font-size:15px;font-weight:600;">${startLabel}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#7c3aed;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Daily pace</td>
                  <td align="right" style="padding:6px 0;color:#1e293b;font-size:15px;font-weight:600;">${pace}/day</td>
                </tr>
                ${finishDate ? `<tr>
                  <td style="padding:6px 0;color:#7c3aed;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">You'll finish by</td>
                  <td align="right" style="padding:6px 0;color:#1e293b;font-size:15px;font-weight:600;">${finishDate}</td>
                </tr>` : ""}
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
            Small daily habits compound into remarkable results. Just ${pace} a day — that's less than most people spend scrolling. You've got this.
          </p>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td align="center">
              <a href="https://biblehabit.co/today" style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
                Read Today's Chapter →
              </a>
            </td></tr>
          </table>

          <!-- Affiliate -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;margin:0 0 24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#92400e;">📖 Reading a physical Bible?</p>
              <p style="margin:0 0 12px;font-size:14px;color:#78350f;line-height:1.5;">
                There's something special about holding Scripture in your hands. We recommend the ESV Study Bible — detailed notes on every page.
              </p>
              <a href="https://www.amazon.com/s?k=esv+study+bible&tag=hdsignals-20" style="color:#92400e;font-size:14px;font-weight:600;text-decoration:underline;">
                Browse top-rated Bibles on Amazon →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">
            Keep going,<br>
            <strong style="color:#475569;">The BibleHabit Team</strong><br>
            <span style="font-size:12px;">biblehabit.co · <a href="https://biblehabit.co" style="color:#7c3aed;">Open app</a></span>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f1f5f9;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            You're receiving this because you created a reading plan at biblehabit.co.<br>
            <a href="https://biblehabit.co" style="color:#7c3aed;">Manage preferences</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: "BibleHabit <hello@biblehabit.co>",
      to: email,
      subject: `Your reading plan starts today — ${startLabel}`,
      html,
    });

    if (error) {
      console.error("[email/welcome] Resend error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("[email/welcome]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
