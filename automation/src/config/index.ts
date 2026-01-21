/**
 * Configuration Loader
 *
 * Loads environment variables from root .env file
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import type { AutomationConfig } from '../types/index.js';

// Load .env from project root
config({ path: resolve(process.cwd(), '../.env') });
// Also try current directory
config({ path: resolve(process.cwd(), '.env') });

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export function loadConfig(): AutomationConfig {
  return {
    strapi: {
      url: getEnvVar('STRAPI_URL'),
      apiToken: getEnvVar('STRAPI_API_TOKEN'),
    },
    anthropic: {
      apiKey: getEnvVar('ANTHROPIC_API_KEY'),
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    },
    openai: {
      apiKey: getEnvVar('OPENAI_API_KEY'),
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      allowedUsers: process.env.TELEGRAM_ALLOWED_USERS
        ? process.env.TELEGRAM_ALLOWED_USERS.split(',').map(Number)
        : [],
    },
    defaults: {
      authorName: process.env.DEFAULT_AUTHOR || 'AUTOBLOG AI',
      status: (process.env.DEFAULT_STATUS as 'draft' | 'published') || 'draft',
    },
  };
}

// Validate configuration on load
export function validateConfig(config: AutomationConfig): void {
  const errors: string[] = [];

  if (!config.strapi.url) errors.push('STRAPI_URL is required');
  if (!config.strapi.apiToken) errors.push('STRAPI_API_TOKEN is required');
  if (!config.anthropic.apiKey) errors.push('ANTHROPIC_API_KEY is required');
  if (!config.openai.apiKey) errors.push('OPENAI_API_KEY is required');

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

// Singleton config instance
let _config: AutomationConfig | null = null;

export function getConfig(): AutomationConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}
