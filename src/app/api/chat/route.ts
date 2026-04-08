import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a warm, knowledgeable assistant for BibleHabit.co — a daily Bible reading app. Help users with:
- Setting up or adjusting reading plans (pace, book selection, picking up mid-book)
- Understanding features (streak tracking, translations, keep going / re-read)
- Technical issues (syncing, login, progress not saving)
- Bible questions and encouragement

If users seem overwhelmed or behind, suggest slowing down their pace. Always be encouraging and grace-filled. Keep responses short (2-4 sentences). If they report a bug or have a feature idea, thank them and say it goes directly to the team.`;

export async function POST(req: NextRequest) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'missing' });
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const anthropicMessages = messages
      .filter((m: { role: string; content: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
