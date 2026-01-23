#!/usr/bin/env node
/**
 * System Health Check Script
 * Checks if all components are configured correctly
 */

// Try to load dotenv if available (optional)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, use environment variables directly
}

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

console.log('\n🔍 AUTOBLOG System Health Check\n');
console.log('=' .repeat(50));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log(`   STRAPI_URL: ${STRAPI_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   STRAPI_API_TOKEN: ${STRAPI_API_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   TELEGRAM_WEBHOOK_SECRET: ${TELEGRAM_WEBHOOK_SECRET ? '✅ Set' : '⚠️  Not set (optional)'}`);
console.log(`   NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL ? '✅ Set' : '❌ Missing'}`);

// Check Strapi connection
async function checkStrapi() {
  if (!STRAPI_URL || !STRAPI_API_TOKEN) {
    console.log('\n❌ Strapi: Cannot check (missing credentials)');
    return;
  }

  try {
    const response = await fetch(`${STRAPI_URL}/api/articles?pagination[limit]=1`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ Strapi: Connected successfully`);
      console.log(`   URL: ${STRAPI_URL}`);
      console.log(`   Articles found: ${data.meta?.pagination?.total || 0}`);
    } else {
      console.log(`\n❌ Strapi: Connection failed (${response.status})`);
      console.log(`   Check your STRAPI_URL and STRAPI_API_TOKEN`);
    }
  } catch (error) {
    console.log(`\n❌ Strapi: Connection error - ${error.message}`);
  }
}

// Check Telegram webhook
async function checkTelegramWebhook() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('\n❌ Telegram: Cannot check (missing TELEGRAM_BOT_TOKEN)');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const data = await response.json();

    if (data.ok) {
      const webhook = data.result;
      console.log(`\n📱 Telegram Webhook:`);
      console.log(`   URL: ${webhook.url || '(not set)'}`);
      console.log(`   Pending updates: ${webhook.pending_update_count || 0}`);
      if (webhook.last_error_message) {
        console.log(`   ⚠️  Last error: ${webhook.last_error_message}`);
      } else {
        console.log(`   ✅ No errors`);
      }
    } else {
      console.log(`\n❌ Telegram: Failed to get webhook info`);
    }
  } catch (error) {
    console.log(`\n❌ Telegram: Error - ${error.message}`);
  }
}

// Check webhook endpoint
async function checkWebhookEndpoint() {
  if (!NEXT_PUBLIC_SITE_URL) {
    console.log('\n❌ Webhook Endpoint: Cannot check (missing NEXT_PUBLIC_SITE_URL)');
    return;
  }

  try {
    const response = await fetch(`${NEXT_PUBLIC_SITE_URL}/api/telegram`);
    const data = await response.json();

    console.log(`\n🌐 Webhook Endpoint:`);
    console.log(`   URL: ${NEXT_PUBLIC_SITE_URL}/api/telegram`);
    console.log(`   Status: ${response.ok ? '✅ Accessible' : '❌ Not accessible'}`);
    console.log(`   Bot: ${data.bot || 'Unknown'}`);
    console.log(`   Strapi: ${data.strapi || 'Unknown'}`);
    console.log(`   AI: ${data.ai || 'Unknown'}`);
  } catch (error) {
    console.log(`\n❌ Webhook Endpoint: Cannot reach - ${error.message}`);
    console.log(`   Make sure ${NEXT_PUBLIC_SITE_URL} is deployed and accessible`);
  }
}

// Run all checks
async function runChecks() {
  await checkStrapi();
  await checkTelegramWebhook();
  await checkWebhookEndpoint();

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Health check complete!\n');
}

runChecks().catch(console.error);
