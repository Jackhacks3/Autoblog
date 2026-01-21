#!/usr/bin/env tsx
/**
 * Telegram Bot Runner
 *
 * Starts the Telegram bot for content generation
 *
 * Usage:
 *   npm run telegram
 *   npx tsx scripts/telegram-bot.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Telegraf } from 'telegraf';
import chalk from 'chalk';

// Load environment variables
config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

import { getTelegramBot } from '../src/clients/telegram.js';
import {
  handleStart,
  handleHelp,
  handleStatus,
  handleMessage,
} from '../src/services/telegram-handler.js';

async function main() {
  console.log(chalk.blue('\n🤖 Starting AUTOBLOG Telegram Bot...\n'));

  // Validate token
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error(chalk.red('Error: TELEGRAM_BOT_TOKEN is not set in .env'));
    console.log(chalk.yellow('\nTo create a Telegram bot:'));
    console.log('1. Open Telegram and search for @BotFather');
    console.log('2. Send /newbot and follow the instructions');
    console.log('3. Copy the token and add it to your .env file:');
    console.log(chalk.cyan('   TELEGRAM_BOT_TOKEN=your_token_here\n'));
    process.exit(1);
  }

  try {
    const bot = getTelegramBot();

    // Register command handlers
    bot.command('start', handleStart);
    bot.command('help', handleHelp);
    bot.command('status', handleStatus);

    // Register message handler for text messages
    bot.on('text', handleMessage);

    // Error handling
    bot.catch((err, ctx) => {
      console.error(chalk.red(`Error for ${ctx.updateType}:`), err);
    });

    // Get bot info
    const botInfo = await bot.telegram.getMe();
    console.log(chalk.green(`✓ Bot connected: @${botInfo.username}`));
    console.log(chalk.gray(`  Bot ID: ${botInfo.id}`));

    // Check for allowed users
    const allowedUsers = process.env.TELEGRAM_ALLOWED_USERS;
    if (allowedUsers) {
      console.log(chalk.gray(`  Allowed users: ${allowedUsers}`));
    } else {
      console.log(chalk.yellow('  Warning: No user whitelist configured (TELEGRAM_ALLOWED_USERS)'));
      console.log(chalk.yellow('  Anyone can use this bot!'));
    }

    console.log(chalk.blue('\n📱 Bot is running! Send a message to start.\n'));
    console.log(chalk.gray('Press Ctrl+C to stop.\n'));

    // Start polling
    await bot.launch();

    // Graceful shutdown
    process.once('SIGINT', () => {
      console.log(chalk.yellow('\n\nShutting down...'));
      bot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      console.log(chalk.yellow('\n\nShutting down...'));
      bot.stop('SIGTERM');
    });
  } catch (error) {
    console.error(chalk.red('Failed to start bot:'), error);
    process.exit(1);
  }
}

main();
