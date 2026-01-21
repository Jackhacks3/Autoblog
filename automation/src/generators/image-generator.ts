/**
 * Image Generator
 *
 * Uses DALL-E 3 to generate hero images for articles
 */

import { generateImage } from '../clients/openai.js';
import { getPillar } from '../config/content-pillars.js';
import type { GeneratedArticle, GeneratedImage, ImageRequest } from '../types/index.js';

/**
 * Extract key themes from article content for image generation
 */
function extractThemes(article: GeneratedArticle): string[] {
  const themes: string[] = [];

  // Add tags as themes
  themes.push(...article.tags.slice(0, 3));

  // Extract key concepts from title
  const titleWords = article.title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4 && !['with', 'from', 'into', 'your', 'that'].includes(word));
  themes.push(...titleWords.slice(0, 2));

  return [...new Set(themes)].slice(0, 5);
}

/**
 * Get pillar-specific visual elements
 */
function getPillarVisuals(pillarSlug: string): string {
  const visuals: Record<string, string> = {
    'ai-automation': `
Elements: Abstract neural network with luminous blue nodes connected by flowing data streams.
Style details: Glowing particles, circuit-inspired patterns, soft gradients suggesting computation.
Background: Subtle grid pattern fading into depth with floating geometric shapes.`,

    'digital-assets': `
Elements: Interlocking hexagonal blockchain pattern with golden accent highlights.
Style details: Secure vault metaphors, tokenized asset abstractions, network connectivity.
Background: Deep blue gradient with digital grid and floating geometric asset icons.`,

    'consulting': `
Elements: Abstract strategic roadmap with ascending pathways and milestone markers.
Style details: Growth visualization, transformation metaphors, data-driven decision imagery.
Background: Gradient from deep navy to lighter horizon with subtle chart elements.`,

    'industry-news': `
Elements: Global network visualization with pulsing connection points across continents.
Style details: Dynamic energy, innovation signals, technology evolution concepts.
Background: Dynamic gradient suggesting movement and change with abstract iconography.`,
  };

  return visuals[pillarSlug] || visuals['ai-automation'];
}

/**
 * Build a DALL-E prompt for the article
 */
function buildImagePrompt(article: GeneratedArticle): string {
  const themes = extractThemes(article);
  const pillarVisuals = getPillarVisuals(article.pillar);

  return `
Professional blog header image for an article titled "${article.title}".

Topic themes: ${themes.join(', ')}

${pillarVisuals}

Style: Modern, clean, minimalist corporate aesthetic with depth and dimension.
Color palette: Professional blues (#0ea5e9, #0284c7), teals (#14b8a6), and clean whites.
Composition: Balanced asymmetric layout with clear focal point and negative space.
Mood: Innovative, forward-thinking, trustworthy, professional.
Quality: Photorealistic rendering, high resolution, suitable for web headers.

IMPORTANT: NO text, NO logos, NO human faces, NO hands, NO cluttered elements.
`.trim();
}

/**
 * Generate SEO-friendly alt text for the image
 */
function generateAltText(article: GeneratedArticle): string {
  const pillar = getPillar(article.pillar);
  const pillarName = pillar?.name || 'technology';
  const themes = extractThemes(article).slice(0, 2).join(' and ');

  return `Abstract visualization representing ${themes} in ${pillarName.toLowerCase()} with professional blue gradients`;
}

/**
 * Generate a hero image for an article
 */
export async function generateHeroImage(
  article: GeneratedArticle,
  options?: Partial<ImageRequest>
): Promise<GeneratedImage> {
  const prompt = buildImagePrompt(article);

  const image = await generateImage({
    prompt,
    size: options?.size || '1792x1024',
    quality: 'standard',
    style: options?.style || 'natural',
  });

  // Add alt text
  image.altText = generateAltText(article);

  return image;
}

/**
 * Generate a filename for the image based on article slug
 */
export function generateImageFilename(article: GeneratedArticle): string {
  const timestamp = Date.now();
  return `${article.slug}-hero-${timestamp}.png`;
}
