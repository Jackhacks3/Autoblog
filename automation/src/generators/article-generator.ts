/**
 * Article Generator
 *
 * Uses Claude API to generate structured blog articles
 */

import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateStructuredContent } from '../clients/anthropic.js';
import { getPillar, getDefaultTemplate } from '../config/content-pillars.js';
import type { ArticleRequest, GeneratedArticle, ArticleTemplate } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load a prompt file from the prompts directory
 */
async function loadPrompt(filename: string): Promise<string> {
  const promptPath = resolve(__dirname, '../../prompts', filename);
  return readFile(promptPath, 'utf-8');
}

/**
 * Load a template file
 */
async function loadTemplate(template: ArticleTemplate): Promise<string> {
  const templatePath = resolve(__dirname, '../../prompts/templates', `${template}.md`);
  try {
    return await readFile(templatePath, 'utf-8');
  } catch {
    // Return empty if template doesn't exist
    return '';
  }
}

/**
 * Calculate reading time from word count
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Generate a URL-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/**
 * Truncate text to a maximum length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
}

interface ClaudeArticleResponse {
  title: string;
  slug?: string;
  description?: string;
  excerpt: string;
  content: string;
  tags: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
  };
}

/**
 * Build the user prompt for article generation
 */
function buildUserPrompt(
  request: ArticleRequest,
  pillarName: string,
  tone: string,
  keywords: string[],
  templateContent: string
): string {
  const lengthGuidance = {
    short: '600-800 words',
    medium: '1,000-1,500 words',
    long: '1,500-2,500 words',
  };

  return `
## Article Request

**Topic:** ${request.topic}
**Content Pillar:** ${pillarName}
**Article Type:** ${request.template}
**Target Length:** ${lengthGuidance[request.targetLength || 'medium']}

## Pillar-Specific Guidance

**Tone:** ${tone}
**Target Keywords:** ${keywords.join(', ')}
${request.keywords ? `**Additional Keywords:** ${request.keywords.join(', ')}` : ''}

## Template Guidelines

${templateContent || 'Follow the standard content structure from the system prompt.'}

## Instructions

Generate a complete, publish-ready article on the topic above. Follow all guidelines from the system prompt and template. Return your response as valid JSON matching the required schema.

Remember:
- Title should be 50-60 characters, SEO-optimized
- Description must be under 80 characters (Strapi Cloud limit)
- Excerpt should be 150-200 characters
- Content should be well-structured Markdown
- Include 3-5 relevant tags
- SEO meta title and description must be compelling
`.trim();
}

/**
 * Generate an article using Claude API
 */
export async function generateArticle(request: ArticleRequest): Promise<GeneratedArticle> {
  // Get pillar configuration
  const pillar = getPillar(request.pillar);
  if (!pillar) {
    throw new Error(`Unknown content pillar: ${request.pillar}`);
  }

  // Determine template to use
  const template = request.template || getDefaultTemplate(request.pillar);

  // Load prompts
  const systemPrompt = await loadPrompt('blog-generator.md');
  const templateContent = await loadTemplate(template);

  // Build user prompt
  const userPrompt = buildUserPrompt(
    { ...request, template },
    pillar.name,
    pillar.tone,
    pillar.targetKeywords,
    templateContent
  );

  // Generate content with Claude
  const response = await generateStructuredContent<ClaudeArticleResponse>(
    systemPrompt,
    userPrompt,
    {
      maxTokens: 8192,
      temperature: 0.7,
    }
  );

  // Process and validate response
  const slug = response.slug || generateSlug(response.title);
  const description = truncate(response.description || response.excerpt, 80);
  const readingTime = calculateReadingTime(response.content);

  return {
    title: response.title,
    slug,
    description,
    excerpt: truncate(response.excerpt, 200),
    content: response.content,
    tags: response.tags || [],
    seo: {
      metaTitle: truncate(response.seo?.metaTitle || response.title, 60),
      metaDescription: truncate(response.seo?.metaDescription || response.excerpt, 160),
    },
    readingTime,
    pillar: request.pillar,
    template,
  };
}

/**
 * Generate multiple articles in batch
 */
export async function generateArticles(
  requests: ArticleRequest[]
): Promise<{ success: GeneratedArticle[]; errors: { request: ArticleRequest; error: Error }[] }> {
  const success: GeneratedArticle[] = [];
  const errors: { request: ArticleRequest; error: Error }[] = [];

  for (const request of requests) {
    try {
      const article = await generateArticle(request);
      success.push(article);
    } catch (error) {
      errors.push({ request, error: error as Error });
    }
  }

  return { success, errors };
}
