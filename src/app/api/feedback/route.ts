import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { feedback, product, timestamp } = await req.json();

    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'BibleHabit Assistant <noreply@biblehabit.co>',
            to: ['hello@biblehabit.co'],
            subject: `[${product}] In-app feedback`,
            text: `New feedback from chat widget:\n\n${feedback}\n\nTimestamp: ${timestamp}`,
          }),
        });
        if (!res.ok) {
          console.error('Resend error:', await res.text());
        }
      } catch (err) {
        console.error('Resend send failed:', err);
      }
    } else {
      console.log('[Feedback]', { product, timestamp, feedback });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ success: true }); // always return success
  }
}
