/**
 * Telegram Message Handler
 *
 * Processes incoming Telegram messages and generates content
 */

import { Context } from 'telegraf';
import {
  sendMessage,
  sendTypingAction,
  extractUrls,
  isAuthorizedUser,
  formatArticleMessage,
  formatErrorMessage,
} from '../clients/telegram.js';
import {
  fetchArticleContent,
  analyzeArticle,
  analyzeText,
  buildTopicFromAnalysis,
} from './article-analyzer.js';
import { runPipeline } from '../core/content-engine.js';
import { getConfig } from '../config/index.js';
import type { ArticleRequest, ArticleAnalysis } from '../types/index.js';

// Store pending analyses for confirmation flow
const pendingAnalyses = new Map<number, {
  analysis: ArticleAnalysis;
  sourceUrl?: string;
  timestamp: number;
}>();

/**
 * Handle incoming /start command
 */
export async function handleStart(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const welcomeMessage = `
<b>Welcome to AUTOBLOG Content Generator!</b>

I can analyze articles and generate similar content for your blog.

<b>How to use:</b>
1. Send me a URL to an article you like
2. I'll analyze it and suggest a similar topic
3. Confirm to generate and publish

<b>Commands:</b>
/start - Show this message
/help - Get help
/status - Check system status

Just send me an article URL to get started!
  `.trim();

  await sendMessage(chatId, welcomeMessage);
}

/**
 * Handle /help command
 */
export async function handleHelp(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const helpMessage = `
<b>AUTOBLOG Content Generator Help</b>

<b>Generate from URL:</b>
Simply send any article URL and I'll:
1. Fetch and analyze the content
2. Suggest a similar topic and approach
3. Generate a unique article inspired by it
4. Publish to your CMS

<b>Generate from Text:</b>
You can also paste article text directly. Just send a message starting with "text:" followed by the content.

<b>After Analysis:</b>
- Reply "yes" or "generate" to create the article
- Reply "no" or "cancel" to start over
- Reply with a custom topic to override the suggestion

<b>Content Pillars:</b>
- AI & Automation
- Digital Assets
- Consulting Insights
- Industry News

<b>Need more help?</b>
Contact the administrator.
  `.trim();

  await sendMessage(chatId, helpMessage);
}

/**
 * Handle /status command
 */
export async function handleStatus(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  try {
    // Check if we have pending analysis
    const pending = pendingAnalyses.get(chatId);
    const hasPending = pending && (Date.now() - pending.timestamp) < 15 * 60 * 1000;

    const statusMessage = `
<b>System Status</b>

Bot: Online
Pending Analysis: ${hasPending ? 'Yes (reply yes/no to continue)' : 'None'}

Send an article URL to start generating content.
    `.trim();

    await sendMessage(chatId, statusMessage);
  } catch (error) {
    await sendMessage(chatId, formatErrorMessage(error as Error));
  }
}

/**
 * Handle incoming text messages
 */
export async function handleMessage(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  const messageText = (ctx.message as { text?: string })?.text;

  if (!chatId || !userId || !messageText) return;

  // Check authorization
  const config = getConfig();
  if (!isAuthorizedUser(userId, config.telegram?.allowedUsers)) {
    await sendMessage(chatId, 'Sorry, you are not authorized to use this bot.');
    return;
  }

  // Check for confirmation responses
  const pending = pendingAnalyses.get(chatId);
  if (pending && (Date.now() - pending.timestamp) < 15 * 60 * 1000) {
    await handleConfirmation(chatId, messageText, pending);
    return;
  }

  // Check for URLs
  const urls = extractUrls(messageText);
  if (urls.length > 0) {
    await handleUrlMessage(chatId, urls[0]!);
    return;
  }

  // Check for text: prefix
  if (messageText.toLowerCase().startsWith('text:')) {
    const text = messageText.slice(5).trim();
    await handleTextMessage(chatId, text);
    return;
  }

  // Default response
  await sendMessage(
    chatId,
    'Send me an article URL to analyze, or start your message with "text:" followed by content to analyze plain text.'
  );
}

/**
 * Handle URL-based article analysis
 */
async function handleUrlMessage(chatId: number, url: string): Promise<void> {
  try {
    await sendTypingAction(chatId);
    await sendMessage(chatId, `Fetching article from: ${url}\n\nPlease wait...`);

    // Fetch and analyze
    await sendTypingAction(chatId);
    const article = await fetchArticleContent(url);

    await sendMessage(chatId, `Found: <b>${escapeHtml(article.title)}</b>\n\nAnalyzing content...`);

    await sendTypingAction(chatId);
    const analysis = await analyzeArticle(article);

    // Store pending analysis
    pendingAnalyses.set(chatId, {
      analysis,
      sourceUrl: url,
      timestamp: Date.now(),
    });

    // Send analysis summary
    const analysisMessage = `
<b>Article Analysis Complete!</b>

<b>Suggested Topic:</b>
${escapeHtml(analysis.topic)}

<b>New Article Title:</b>
${escapeHtml(analysis.title)}

<b>Content Pillar:</b> ${analysis.suggestedPillar}
<b>Template:</b> ${analysis.suggestedTemplate}
<b>Target Audience:</b> ${escapeHtml(analysis.targetAudience)}

<b>Key Points to Cover:</b>
${analysis.keyPoints.map(p => `• ${escapeHtml(p)}`).join('\n')}

<b>Keywords:</b> ${analysis.keywords.join(', ')}

Reply <b>"yes"</b> to generate this article, or send a custom topic to override.
    `.trim();

    await sendMessage(chatId, analysisMessage);
  } catch (error) {
    await sendMessage(chatId, formatErrorMessage(error as Error));
  }
}

/**
 * Handle plain text analysis
 */
async function handleTextMessage(chatId: number, text: string): Promise<void> {
  if (text.length < 100) {
    await sendMessage(chatId, 'Please provide more content to analyze (at least 100 characters).');
    return;
  }

  try {
    await sendTypingAction(chatId);
    await sendMessage(chatId, 'Analyzing your text...');

    const analysis = await analyzeText(text);

    // Store pending analysis
    pendingAnalyses.set(chatId, {
      analysis,
      timestamp: Date.now(),
    });

    // Send analysis summary
    const analysisMessage = `
<b>Text Analysis Complete!</b>

<b>Suggested Topic:</b>
${escapeHtml(analysis.topic)}

<b>New Article Title:</b>
${escapeHtml(analysis.title)}

<b>Content Pillar:</b> ${analysis.suggestedPillar}
<b>Template:</b> ${analysis.suggestedTemplate}

<b>Key Points:</b>
${analysis.keyPoints.map(p => `• ${escapeHtml(p)}`).join('\n')}

Reply <b>"yes"</b> to generate this article, or send a custom topic to override.
    `.trim();

    await sendMessage(chatId, analysisMessage);
  } catch (error) {
    await sendMessage(chatId, formatErrorMessage(error as Error));
  }
}

/**
 * Handle confirmation or custom topic response
 */
async function handleConfirmation(
  chatId: number,
  response: string,
  pending: { analysis: ArticleAnalysis; sourceUrl?: string; timestamp: number }
): Promise<void> {
  const lowerResponse = response.toLowerCase().trim();

  // Cancel
  if (lowerResponse === 'no' || lowerResponse === 'cancel') {
    pendingAnalyses.delete(chatId);
    await sendMessage(chatId, 'Cancelled. Send a new URL to start over.');
    return;
  }

  // Confirm or custom topic
  const isConfirm = lowerResponse === 'yes' || lowerResponse === 'generate' || lowerResponse === 'ok';
  const customTopic = isConfirm ? undefined : response;

  try {
    await sendTypingAction(chatId);
    await sendMessage(chatId, 'Generating article... This may take a minute.');

    const topic = buildTopicFromAnalysis(pending.analysis, customTopic);

    const request: ArticleRequest = {
      topic,
      pillar: pending.analysis.suggestedPillar,
      template: pending.analysis.suggestedTemplate,
      keywords: pending.analysis.keywords,
      targetLength: 'medium',
    };

    await sendTypingAction(chatId);
    const result = await runPipeline(request, {
      generateImage: true,
      skipCms: false,
    });

    // Clear pending
    pendingAnalyses.delete(chatId);

    if (result.success && result.article) {
      const successMessage = formatArticleMessage({
        title: result.article.title,
        slug: result.article.slug,
        description: result.article.description,
      });

      await sendMessage(chatId, successMessage);

      // Send pipeline summary
      const stagesSummary = result.stages
        .map(s => `${s.name}: ${s.status} (${s.duration}ms)`)
        .join('\n');

      await sendMessage(chatId, `<b>Pipeline Summary:</b>\n<code>${stagesSummary}</code>`);
    } else {
      const errorMessages = result.errors.map(e => e.message).join('\n');
      await sendMessage(
        chatId,
        `<b>Generation failed:</b>\n${escapeHtml(errorMessages)}\n\nTry again with a different URL.`
      );
    }
  } catch (error) {
    pendingAnalyses.delete(chatId);
    await sendMessage(chatId, formatErrorMessage(error as Error));
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
