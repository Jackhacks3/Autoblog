/**
 * Intake API Route
 *
 * Receives article topic requests from the /intake form.
 * Notifies via Telegram if configured.
 */

import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_ALLOWED_USERS?.split(',')[0];

interface IntakeRequest {
  topic: string;
  pillar: string;
  notes?: string;
  email?: string;
}

async function sendTelegramNotification(payload: IntakeRequest) {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;

  const lines = [
    '📥 *New blog request*',
    '',
    `*Topic:* ${payload.topic}`,
    `*Category:* ${payload.pillar}`,
    payload.notes ? `*Notes:* ${payload.notes}` : null,
    payload.email ? `*Email:* ${payload.email}` : null,
  ].filter(Boolean).join('\n');

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text: lines,
      parse_mode: 'Markdown',
    }),
  });
}

export async function POST(req: NextRequest) {
  let body: IntakeRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { topic, pillar } = body;

  if (!topic?.trim() || !pillar?.trim()) {
    return NextResponse.json({ error: 'topic and pillar are required' }, { status: 422 });
  }

  const allowed = ['ai-automation', 'consulting', 'industry-news', 'digital-assets'];
  if (!allowed.includes(pillar)) {
    return NextResponse.json({ error: 'Invalid pillar' }, { status: 422 });
  }

  // Fire-and-forget Telegram notification
  sendTelegramNotification(body).catch((err) =>
    console.error('Telegram notification failed:', err)
  );

  console.log('[intake]', JSON.stringify({ topic, pillar, email: body.email || null }));

  return NextResponse.json({ ok: true });
}
