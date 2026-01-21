/**
 * Telegram Webhook API Route
 *
 * Receives messages from Telegram and processes them.
 * Works on Vercel serverless functions.
 */

import { NextRequest, NextResponse } from 'next/server';

// Telegram Bot Token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USERS = process.env.TELEGRAM_ALLOWED_USERS?.split(',').map(id => parseInt(id.trim())).filter(Boolean) || [];
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

// Strapi config
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// AI config
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
}

interface TelegramMessage {
  chat_id: number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}

// Store pending analyses (in production, use Redis or a database)
const pendingAnalyses = new Map<number, {
  topic: string;
  pillar: string;
  template: string;
  keywords: string[];
  timestamp: number;
}>();

/**
 * Send a message via Telegram API
 */
async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    } as TelegramMessage),
  });
}

/**
 * Send typing indicator
 */
async function sendTypingAction(chatId: number): Promise<void> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      action: 'typing',
    }),
  });
}

/**
 * Check if user is authorized
 */
function isAuthorized(userId: number): boolean {
  if (ALLOWED_USERS.length === 0) return true; // No whitelist = allow all
  return ALLOWED_USERS.includes(userId);
}

/**
 * Extract URLs from text
 */
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Fetch and extract article content from URL
 */
async function fetchArticleContent(url: string): Promise<{ title: string; content: string }> {
  const response = await fetch(url);
  const html = await response.text();

  // Simple extraction - get title and body text
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  // Strip HTML tags for content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const content = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000); // Limit content length

  return { title, content };
}

/**
 * Analyze article using Claude API
 */
async function analyzeArticle(title: string, content: string): Promise<{
  topic: string;
  suggestedTitle: string;
  pillar: string;
  template: string;
  keywords: string[];
  keyPoints: string[];
}> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Analyze this article and suggest a new, original article topic inspired by it.

Article Title: ${title}
Article Content: ${content.slice(0, 3000)}

Return JSON only:
{
  "topic": "A specific topic for a new article (different angle/perspective)",
  "suggestedTitle": "SEO-optimized title for the new article (50-60 chars)",
  "pillar": "ai-automation or consulting or industry-news",
  "template": "how-to-guide or tutorial or explainer or thought-leadership or news-analysis",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "keyPoints": ["point 1 to cover", "point 2 to cover", "point 3 to cover"]
}`
      }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse analysis');

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate article using Claude API
 */
async function generateArticle(topic: string, pillar: string, template: string, keywords: string[]): Promise<{
  title: string;
  slug: string;
  description: string;
  content: string;
}> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Write a blog article on this topic:

Topic: ${topic}
Content Pillar: ${pillar}
Article Type: ${template}
Keywords to include: ${keywords.join(', ')}

Return JSON only:
{
  "title": "SEO title 50-60 chars",
  "slug": "url-friendly-slug",
  "description": "Brief description under 80 chars",
  "content": "Full article in Markdown format, 1000-1500 words"
}`
      }],
    }),
  });

  const data = await response.json();
  const text = data.content[0].text;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse article');

  return JSON.parse(jsonMatch[0]);
}

/**
 * Publish article to Strapi
 */
async function publishToStrapi(article: {
  title: string;
  slug: string;
  description: string;
  content: string;
}): Promise<{ documentId: string }> {
  const response = await fetch(`${STRAPI_URL}/api/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({
      data: {
        title: article.title,
        slug: article.slug,
        description: article.description,
        blocks: [{
          __component: 'shared.rich-text',
          body: article.content,
        }],
      },
    }),
  });

  const data = await response.json();
  return { documentId: data.data.documentId };
}

/**
 * Handle /start command
 */
async function handleStart(chatId: number): Promise<void> {
  const message = `
<b>Welcome to AUTOBLOG!</b>

I generate original blog content inspired by articles you share.

<b>How to use:</b>
1. Send me any article URL
2. I'll analyze it and suggest a topic
3. Reply "yes" to generate & publish

<b>Commands:</b>
/start - This message
/help - Get help
/status - Check status

Send a URL to begin!
  `.trim();

  await sendTelegramMessage(chatId, message);
}

/**
 * Handle /help command
 */
async function handleHelp(chatId: number): Promise<void> {
  const message = `
<b>AUTOBLOG Help</b>

<b>Generate from URL:</b>
Send any article URL and I'll create original content inspired by it.

<b>After analysis:</b>
• Reply "yes" to generate
• Reply "no" to cancel
• Send custom topic to override

<b>Content types:</b>
• AI & Automation
• Consulting Insights
• Industry News
  `.trim();

  await sendTelegramMessage(chatId, message);
}

/**
 * Handle /status command
 */
async function handleStatus(chatId: number): Promise<void> {
  const pending = pendingAnalyses.get(chatId);
  const hasPending = pending && (Date.now() - pending.timestamp) < 15 * 60 * 1000;

  const message = `
<b>System Status</b>

Bot: ✅ Online
Strapi: ${STRAPI_URL ? '✅ Connected' : '❌ Not configured'}
AI: ${ANTHROPIC_API_KEY ? '✅ Ready' : '❌ Not configured'}
Pending: ${hasPending ? 'Yes - reply yes/no' : 'None'}
  `.trim();

  await sendTelegramMessage(chatId, message);
}

/**
 * Handle URL message - analyze article
 */
async function handleUrl(chatId: number, url: string): Promise<void> {
  try {
    await sendTypingAction(chatId);
    await sendTelegramMessage(chatId, `📥 Fetching: ${url}`);

    const { title, content } = await fetchArticleContent(url);

    await sendTypingAction(chatId);
    await sendTelegramMessage(chatId, `📊 Analyzing: <b>${escapeHtml(title)}</b>`);

    const analysis = await analyzeArticle(title, content);

    // Store for confirmation
    pendingAnalyses.set(chatId, {
      topic: analysis.topic,
      pillar: analysis.pillar,
      template: analysis.template,
      keywords: analysis.keywords,
      timestamp: Date.now(),
    });

    const message = `
<b>Analysis Complete!</b>

<b>New Article Topic:</b>
${escapeHtml(analysis.topic)}

<b>Suggested Title:</b>
${escapeHtml(analysis.suggestedTitle)}

<b>Type:</b> ${analysis.pillar} / ${analysis.template}

<b>Key Points:</b>
${analysis.keyPoints.map(p => `• ${escapeHtml(p)}`).join('\n')}

Reply <b>"yes"</b> to generate, or <b>"no"</b> to cancel.
    `.trim();

    await sendTelegramMessage(chatId, message);
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ Error: ${(error as Error).message}`);
  }
}

/**
 * Handle confirmation response
 */
async function handleConfirmation(chatId: number, response: string): Promise<void> {
  const pending = pendingAnalyses.get(chatId);

  if (!pending || (Date.now() - pending.timestamp) > 15 * 60 * 1000) {
    await sendTelegramMessage(chatId, 'No pending analysis. Send a URL to start.');
    return;
  }

  const lower = response.toLowerCase().trim();

  if (lower === 'no' || lower === 'cancel') {
    pendingAnalyses.delete(chatId);
    await sendTelegramMessage(chatId, '❌ Cancelled. Send a new URL to start over.');
    return;
  }

  if (lower === 'yes' || lower === 'ok' || lower === 'generate') {
    try {
      await sendTypingAction(chatId);
      await sendTelegramMessage(chatId, '✍️ Generating article... (this takes ~30 seconds)');

      const article = await generateArticle(
        pending.topic,
        pending.pillar,
        pending.template,
        pending.keywords
      );

      await sendTypingAction(chatId);
      await sendTelegramMessage(chatId, '📤 Publishing to CMS...');

      const { documentId } = await publishToStrapi(article);

      pendingAnalyses.delete(chatId);

      const message = `
<b>✅ Article Published!</b>

<b>Title:</b> ${escapeHtml(article.title)}
<b>Slug:</b> ${article.slug}
<b>ID:</b> ${documentId}

Your article is now live in Strapi!
      `.trim();

      await sendTelegramMessage(chatId, message);
    } catch (error) {
      await sendTelegramMessage(chatId, `❌ Error: ${(error as Error).message}`);
    }
  }
}

/**
 * Escape HTML for Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * POST handler - receives Telegram webhook updates
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const secret = request.headers.get('x-telegram-bot-api-secret-token');
      if (secret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const update: TelegramUpdate = await request.json();

    // Only process text messages
    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const userId = update.message.from.id;
    const text = update.message.text;

    // Check authorization
    if (!isAuthorized(userId)) {
      await sendTelegramMessage(chatId, '⛔ You are not authorized to use this bot.');
      return NextResponse.json({ ok: true });
    }

    // Handle commands
    if (text.startsWith('/start')) {
      await handleStart(chatId);
    } else if (text.startsWith('/help')) {
      await handleHelp(chatId);
    } else if (text.startsWith('/status')) {
      await handleStatus(chatId);
    } else {
      // Check for URLs
      const urls = extractUrls(text);
      if (urls.length > 0) {
        await handleUrl(chatId, urls[0]);
      } else if (pendingAnalyses.has(chatId)) {
        await handleConfirmation(chatId, text);
      } else {
        await sendTelegramMessage(chatId, 'Send me an article URL to analyze.');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET handler - for webhook verification
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'AUTOBLOG Telegram Webhook Active',
    bot: BOT_TOKEN ? 'Configured' : 'Not configured',
  });
}
