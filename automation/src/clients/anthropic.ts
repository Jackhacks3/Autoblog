/**
 * Anthropic Claude API Client
 *
 * Wrapper for Claude API with content generation utilities
 */

import Anthropic from '@anthropic-ai/sdk';
import { getConfig } from '../config/index.js';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequestOptions {
  system?: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface ClaudeResponse {
  content: string;
  stopReason: string;
  inputTokens: number;
  outputTokens: number;
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const config = getConfig();
    client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }
  return client;
}

/**
 * Send a message to Claude and get a response
 */
export async function createMessage(options: ClaudeRequestOptions): Promise<ClaudeResponse> {
  const config = getConfig();
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: options.model || config.anthropic.model,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature ?? 0.7,
    system: options.system,
    messages: options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  // Extract text content from response
  const textContent = response.content.find((c) => c.type === 'text');
  const content = textContent?.type === 'text' ? textContent.text : '';

  return {
    content,
    stopReason: response.stop_reason || 'unknown',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/**
 * Generate content with a structured JSON response
 */
export async function generateStructuredContent<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: Partial<ClaudeRequestOptions>
): Promise<T> {
  const response = await createMessage({
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    ...options,
  });

  // Try to extract JSON from the response
  const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as T;
    } catch (e) {
      throw new Error(`Failed to parse JSON response: ${e}`);
    }
  }

  // Try parsing the entire response as JSON
  try {
    return JSON.parse(response.content) as T;
  } catch (e) {
    throw new Error(`Response is not valid JSON: ${response.content.slice(0, 200)}...`);
  }
}

/**
 * Simple text completion without JSON parsing
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options?: Partial<ClaudeRequestOptions>
): Promise<string> {
  const response = await createMessage({
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    ...options,
  });

  return response.content;
}
