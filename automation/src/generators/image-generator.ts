/**
 * Image Generator
 *
 * Uses DALL-E 3 to generate hero images for articles.
 * Image prompt is generated from the full article payload via LLM so images
 * stay aligned with each article automatically.
 */

import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateImage } from '../clients/openai.js';
import { generateText } from '../clients/anthropic.js';
import { getPillar } from '../config/content-pillars.js';
import type { GeneratedArticle, GeneratedImage, ImageRequest } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const IMAGE_PROMPT_SYSTEM = `You generate DALL-E 3 prompts for professional blog hero images. Given a structured article (JSON), output exactly one image prompt—nothing else, no explanation, no markdown.

Rules:
- Prompt must match the article's topic, tone, and key ideas. Use title, description, excerpt, and content.
- Style: Modern, minimal, corporate. Colors: blues (#0ea5e9, #0284c7), teals (#14b8a6), whites.
- Composition: Balanced, clear focal point, negative space. Mood: Innovative, trustworthy.
- NEVER request: text, words, letters, numbers, logos, human faces, hands, brand products, clutter, dark/gloomy or violent imagery.
- Output only the raw DALL-E prompt, 2–4 sentences. No prefix, no code blocks.`;

/**
 * Load image-prompt guidelines for optional context (fallback uses pillar visuals).
 */
async function loadImagePromptGuidelines(): Promise<string> {
  const p = resolve(__dirname, '../../prompts/image-prompt.md');
  try {
    return await readFile(p, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Build the article payload we send to the LLM (subset of GeneratedArticle).
 */
function articlePayloadForImagePrompt(article: GeneratedArticle): object {
  const contentSnippet = article.content.replace(/\s+/g, ' ').trim().slice(0, 1200);
  return {
    title: article.title,
    description: article.description,
    excerpt: article.excerpt,
    contentSnippet,
    tags: article.tags,
    pillar: article.pillar,
    template: article.template,
  };
}

/**
 * Generate image prompt from the full article payload using the LLM.
 */
async function generateImagePromptFromArticle(article: GeneratedArticle): Promise<string> {
  const payload = articlePayloadForImagePrompt(article);
  const userPrompt = `Article (JSON):

\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`

Generate a single DALL-E 3 image prompt that visually captures this article. Output only the prompt.`;

  const guidelines = await loadImagePromptGuidelines();
  const system = guidelines
    ? `${IMAGE_PROMPT_SYSTEM}\n\nReference:\n${guidelines.slice(0, 2000)}`
    : IMAGE_PROMPT_SYSTEM;

  const raw = await generateText(system, userPrompt, {
    maxTokens: 512,
    temperature: 0.4,
  });

  const prompt = raw.trim().replace(/^["']|["']$/g, '');
  if (!prompt || prompt.length < 20) {
    throw new Error('LLM returned empty or too-short image prompt');
  }
  return prompt;
}

/**
 * Rule-based fallback when LLM prompt generation fails.
 */
function extractThemes(article: GeneratedArticle): string[] {
  const themes: string[] = [];
  themes.push(...article.tags.slice(0, 3));
  const titleWords = article.title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4 && !['with', 'from', 'into', 'your', 'that'].includes(w));
  themes.push(...titleWords.slice(0, 2));
  return [...new Set(themes)].slice(0, 5);
}

function getPillarVisuals(pillarSlug: string): string {
  const visuals: Record<string, string> = {
    'ai-automation': `Elements: Abstract neural network with luminous blue nodes, flowing data streams. Style: Glowing particles, circuit-inspired patterns. Background: Subtle grid, floating geometric shapes.`,
    'digital-assets': `Elements: Interlocking hexagonal blockchain pattern, golden accents. Style: Secure vault metaphors, tokenized abstractions. Background: Deep blue gradient, digital grid.`,
    'consulting': `Elements: Strategic roadmap, ascending pathways, milestone markers. Style: Growth visualization, transformation metaphors. Background: Navy to horizon gradient, subtle chart elements.`,
    'industry-news': `Elements: Global network, pulsing connection points. Style: Dynamic energy, innovation signals. Background: Dynamic gradient, abstract iconography.`,
  };
  return visuals[pillarSlug] || visuals['ai-automation'];
}

function buildImagePromptFallback(article: GeneratedArticle): string {
  const themes = extractThemes(article);
  const pillarVisuals = getPillarVisuals(article.pillar);
  return `Professional blog header image for an article titled "${article.title}". Topic themes: ${themes.join(', ')}. ${pillarVisuals} Style: Modern, clean, minimal corporate aesthetic. Colors: blues, teals, whites. Composition: Balanced, clear focal point. Mood: Innovative, trustworthy. NO text, NO logos, NO faces, NO hands.`.trim();
}

/**
 * Build the DALL-E prompt from the article payload (LLM-first, rule-based fallback).
 */
async function buildImagePrompt(article: GeneratedArticle): Promise<string> {
  try {
    return await generateImagePromptFromArticle(article);
  } catch (e) {
    console.warn('Image prompt LLM failed, using rule-based fallback:', (e as Error).message);
    return buildImagePromptFallback(article);
  }
}

/**
 * Generate SEO-friendly alt text for the image.
 */
function generateAltText(article: GeneratedArticle): string {
  const pillar = getPillar(article.pillar);
  const pillarName = pillar?.name || 'technology';
  const themes = extractThemes(article).slice(0, 2).join(' and ');
  return `Abstract visualization representing ${themes} in ${pillarName.toLowerCase()} with professional blue gradients`;
}

/**
 * Generate a hero image for an article.
 * Prompt is derived from the full article payload via LLM when possible.
 */
export async function generateHeroImage(
  article: GeneratedArticle,
  options?: Partial<ImageRequest>
): Promise<GeneratedImage> {
  const prompt = await buildImagePrompt(article);

  const image = await generateImage({
    prompt,
    size: options?.size || '1792x1024',
    quality: 'standard',
    style: options?.style || 'natural',
  });

  image.altText = generateAltText(article);
  return image;
}

/**
 * Generate a filename for the image based on article slug.
 */
export function generateImageFilename(article: GeneratedArticle): string {
  const timestamp = Date.now();
  return `${article.slug}-hero-${timestamp}.png`;
}
