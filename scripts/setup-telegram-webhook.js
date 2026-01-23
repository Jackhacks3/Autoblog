#!/usr/bin/env node
/**
 * Setup Telegram Webhook
 *
 * Registers your Vercel URL as a webhook with Telegram.
 *
 * Usage:
 *   node scripts/setup-telegram-webhook.js https://yourdomain.com
 *   node scripts/setup-telegram-webhook.js https://yourdomain.com --secret mysecret
 *   node scripts/setup-telegram-webhook.js --delete  (to remove webhook)
 */

require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function setWebhook(url, secret) {
  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;

  const body = {
    url: `${url}/api/telegram`,
    allowed_updates: ['message', 'callback_query'],
  };

  if (secret) {
    body.secret_token = secret;
  }

  console.log(`\n🔗 Setting webhook to: ${body.url}\n`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (result.ok) {
    console.log('✅ Webhook set successfully!\n');
    console.log('Telegram will now send messages to your Vercel app.\n');

    if (secret) {
      console.log('⚠️  Add this to your Vercel environment variables:');
      console.log(`   TELEGRAM_WEBHOOK_SECRET=${secret}\n`);
    }
  } else {
    console.error('❌ Failed to set webhook:', result.description);
  }

  return result;
}

async function deleteWebhook() {
  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;

  console.log('\n🗑️  Deleting webhook...\n');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drop_pending_updates: true }),
  });

  const result = await response.json();

  if (result.ok) {
    console.log('✅ Webhook deleted successfully!\n');
    console.log('Bot is now in polling mode (requires local server).\n');
  } else {
    console.error('❌ Failed to delete webhook:', result.description);
  }

  return result;
}

async function getWebhookInfo() {
  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;

  const response = await fetch(apiUrl);
  const result = await response.json();

  console.log('\n📊 Current Webhook Info:\n');
  console.log(`   URL: ${result.result.url || '(not set)'}`);
  console.log(`   Pending updates: ${result.result.pending_update_count}`);
  console.log(`   Last error: ${result.result.last_error_message || '(none)'}`);
  console.log('');

  return result;
}

async function main() {
  if (!BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN not found in environment');
    console.log('\nMake sure you have a .env file with:');
    console.log('TELEGRAM_BOT_TOKEN=your_bot_token\n');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  // Show current info first
  await getWebhookInfo();

  if (args.includes('--delete')) {
    await deleteWebhook();
    return;
  }

  if (args.includes('--info')) {
    return;
  }

  const url = args.find(arg => arg.startsWith('http'));

  if (!url) {
    console.log('Usage:');
    console.log('  node setup-telegram-webhook.js https://yourdomain.com');
    console.log('  node setup-telegram-webhook.js https://yourdomain.com --secret mysecret');
    console.log('  node setup-telegram-webhook.js --delete');
    console.log('  node setup-telegram-webhook.js --info\n');
    return;
  }

  const secretIndex = args.indexOf('--secret');
  const secret = secretIndex !== -1 ? args[secretIndex + 1] : null;

  await setWebhook(url, secret);
}

main().catch(console.error);
