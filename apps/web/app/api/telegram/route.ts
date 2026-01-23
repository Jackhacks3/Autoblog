/**
 * Telegram Webhook API Route
 *
 * Receives messages from Telegram and processes them.
 * Works on Vercel serverless functions with stateless design.
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
  callback_query?: {
    id: string;
    from: { id: number; first_name: string; username?: string };
    message?: { chat: { id: number }; message_id: number };
    data?: string;
  };
}

interface PendingData {
  topic: string;
  pillar: string;
  template: string;
  keywords: string[];
}

/**
 * Encode pending data to base64 for stateless storage
 */
function encodePendingData(data: PendingData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decode pending data from base64
 */
function decodePendingData(encoded: string): PendingData | null {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Send a message via Telegram API
 */
async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object): Promise<void> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
 * Answer callback query
 */
async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

/**
 * Check if user is authorized
 */
function isAuthorized(userId: number): boolean {
  if (ALLOWED_USERS.length === 0) return true;
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

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? 'Untitled';

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch?.[1] ?? html;
  const content = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);

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

  if (!data.content?.[0]?.text) {
    throw new Error(`Claude API error: ${JSON.stringify(data)}`);
  }

  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse analysis response');

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

  if (!data.content?.[0]?.text) {
    throw new Error(`Claude API error: ${JSON.stringify(data)}`);
  }

  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse article response');

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
  if (!STRAPI_URL || !STRAPI_API_TOKEN) {
    throw new Error('Strapi configuration missing: STRAPI_URL or STRAPI_API_TOKEN not set');
  }

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
        excerpt: article.description,
        content: article.content,
        status: 'draft',
        aiGenerated: true,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error?.message || data.message || 'Unknown Strapi error';
    const errorDetails = data.error?.details ? JSON.stringify(data.error.details) : '';
    throw new Error(`Strapi API error (${response.status}): ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`);
  }

  if (!data.data?.documentId && !data.data?.id) {
    const errorMessage = data.error?.message || 'Failed to create article - no documentId returned';
    const errorDetails = data.error?.details ? JSON.stringify(data.error.details) : JSON.stringify(data);
    throw new Error(`Strapi error: ${errorMessage} - ${errorDetails}`);
  }

  return { documentId: data.data.documentId || data.data.id };
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
3. Tap the button to generate & publish

<b>Commands:</b>
/start - This message
/help - Get help
/status - Check system status

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
• Tap "Generate Article" button to create
• Or send a new URL to analyze something else

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
  const strapiOk = !!STRAPI_URL && !!STRAPI_API_TOKEN;
  const aiOk = !!ANTHROPIC_API_KEY;

  const message = `
<b>System Status</b>

Bot: ✅ Online
Strapi: ${strapiOk ? '✅ Configured' : '❌ Missing STRAPI_URL or STRAPI_API_TOKEN'}
AI: ${aiOk ? '✅ Configured' : '❌ Missing ANTHROPIC_API_KEY'}

<b>Environment:</b>
STRAPI_URL: ${STRAPI_URL ? STRAPI_URL.slice(0, 30) + '...' : 'Not set'}
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

    // Encode the pending data for stateless confirmation
    const pendingData: PendingData = {
      topic: analysis.topic,
      pillar: analysis.pillar,
      template: analysis.template,
      keywords: analysis.keywords,
    };
    const encoded = encodePendingData(pendingData);

    const message = `
<b>Analysis Complete!</b>

<b>New Article Topic:</b>
${escapeHtml(analysis.topic)}

<b>Suggested Title:</b>
${escapeHtml(analysis.suggestedTitle)}

<b>Type:</b> ${analysis.pillar} / ${analysis.template}

<b>Key Points:</b>
${analysis.keyPoints.map(p => `• ${escapeHtml(p)}`).join('\n')}

Tap the button below to generate and publish!
    `.trim();

    // Send with inline keyboard button
    await sendTelegramMessage(chatId, message, {
      inline_keyboard: [[
        { text: '✅ Generate Article', callback_data: `generate:${encoded}` },
        { text: '❌ Cancel', callback_data: 'cancel' },
      ]],
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await sendTelegramMessage(chatId, `❌ Error analyzing URL: ${errorMsg}`);
  }
}

/**
 * Handle callback query (button press)
 */
async function handleCallbackQuery(
  callbackQueryId: string,
  chatId: number,
  userId: number,
  data: string
): Promise<void> {
  if (!isAuthorized(userId)) {
    await answerCallbackQuery(callbackQueryId, '⛔ Not authorized');
    return;
  }

  if (data === 'cancel') {
    await answerCallbackQuery(callbackQueryId, 'Cancelled');
    await sendTelegramMessage(chatId, '❌ Cancelled. Send a new URL to start over.');
    return;
  }

  if (data.startsWith('generate:')) {
    const encoded = data.replace('generate:', '');
    const pending = decodePendingData(encoded);

    if (!pending) {
      await answerCallbackQuery(callbackQueryId, 'Invalid data');
      await sendTelegramMessage(chatId, '❌ Error: Invalid generation data. Please send the URL again.');
      return;
    }

    await answerCallbackQuery(callbackQueryId, 'Generating...');

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

      const message = `
<b>✅ Article Published!</b>

<b>Title:</b> ${escapeHtml(article.title)}
<b>Slug:</b> ${article.slug}
<b>ID:</b> ${documentId}

Your article is now in Strapi (as draft). Review and publish it in the admin panel.

${STRAPI_URL}/admin
      `.trim();

      await sendTelegramMessage(chatId, message);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Article generation error:', error);
      await sendTelegramMessage(chatId, `❌ Error generating article: ${errorMsg}\n\nPlease try again or check the system status with /status`);
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

    // Handle callback queries (button presses)
    if (update.callback_query) {
      const { id, from, message, data } = update.callback_query;
      if (message && data) {
        await handleCallbackQuery(id, message.chat.id, from.id, data);
      }
      return NextResponse.json({ ok: true });
    }

    // Handle text messages
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
      const firstUrl = urls[0];
      if (firstUrl) {
        await handleUrl(chatId, firstUrl);
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
    strapi: STRAPI_URL ? 'Configured' : 'Not configured',
    ai: ANTHROPIC_API_KEY ? 'Configured' : 'Not configured',
  });
}
