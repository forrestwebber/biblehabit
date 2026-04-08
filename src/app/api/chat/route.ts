import { NextRequest, NextResponse } from 'next/server';
import { getResponse, getGreeting } from '@/lib/chat-knowledge';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // First message — return greeting
    if (messages.length === 0) {
      return NextResponse.json({ content: getGreeting() });
    }

    // Get the last user message
    const lastUser = [...messages].reverse().find((m: { role: string; content: string }) => m.role === 'user');
    if (!lastUser) {
      return NextResponse.json({ content: getGreeting() });
    }

    const { response, followUps } = getResponse(lastUser.content);

    // Format follow-ups as suggestions if present
    let content = response;
    if (followUps && followUps.length > 0) {
      content += '\n\n_You might also ask:_\n' + followUps.map(f => `• ${f}`).join('\n');
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ content: "Sorry, something went wrong. Try emailing hello@biblehabit.co for help!" });
  }
}
