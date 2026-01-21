/**
 * Telegram Bot Client
 *
 * Handles Telegram bot initialization and messaging
 */

import { Telegraf } from 'telegraf';
import { getConfig } from '../config/index.js';

let bot: Telegraf | null = null;

/**
 * Initialize and get the Telegram bot instance
 */
export function getTelegramBot(): Telegraf {
  if (bot) return bot;

  const config = getConfig();
  if (!config.telegram?.botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  bot = new Telegraf(config.telegram.botToken);
  return bot;
}

/**
 * Send a message to a specific chat
 */
export async function sendMessage(
  chatId: number | string,
  message: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disablePreview?: boolean;
  }
): Promise<void> {
  const telegramBot = getTelegramBot();

  await telegramBot.telegram.sendMessage(chatId, message, {
    parse_mode: options?.parseMode || 'HTML',
    link_preview_options: options?.disablePreview
      ? { is_disabled: true }
      : undefined,
  });
}

/**
 * Send a typing indicator to show the bot is processing
 */
export async function sendTypingAction(chatId: number | string): Promise<void> {
  const telegramBot = getTelegramBot();
  await telegramBot.telegram.sendChatAction(chatId, 'typing');
}

/**
 * Extract URLs from a message text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Check if the user is authorized (optional whitelist)
 */
export function isAuthorizedUser(userId: number, allowedUsers?: number[]): boolean {
  if (!allowedUsers || allowedUsers.length === 0) {
    return true; // No whitelist = allow all
  }
  return allowedUsers.includes(userId);
}

/**
 * Format article result for Telegram message
 */
export function formatArticleMessage(article: {
  title: string;
  slug: string;
  description: string;
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const articleUrl = `${siteUrl}/blog/${article.slug}`;

  return `
<b>Article Generated Successfully!</b>

<b>Title:</b> ${escapeHtml(article.title)}

<b>Description:</b> ${escapeHtml(article.description)}

<b>View Article:</b> ${articleUrl}
  `.trim();
}

/**
 * Format error message for Telegram
 */
export function formatErrorMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;
  return `<b>Error:</b> ${escapeHtml(message)}`;
}

/**
 * Escape HTML special characters for Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
