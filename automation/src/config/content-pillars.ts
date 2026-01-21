/**
 * Optaimum Content Pillars Configuration
 *
 * Defines content categories aligned with Optaimum's AI-powered digital asset platform
 * Focus: AI tools, automation workflows, operational efficiency, business transformation
 */

import type { ContentPillar, ArticleTemplate } from '../types/index.js';

export const CONTENT_PILLARS: Record<string, ContentPillar> = {
  'ai-automation': {
    name: 'AI & Automation',
    categorySlug: 'ai-automation',
    templates: ['how-to-guide', 'tutorial', 'explainer'] as ArticleTemplate[],
    tone: 'Practical and results-focused. Show readers how to implement AI tools for business automation.',
    targetKeywords: [
      'AI automation tools',
      'workflow automation',
      'business automation',
      'AI productivity',
      'Claude API',
      'GPT integration',
      'automation workflows',
      'no-code automation',
      'enterprise AI tools',
      'AI for business',
    ],
  },

  'consulting': {
    name: 'Consulting Insights',
    categorySlug: 'consulting',
    templates: ['thought-leadership', 'framework', 'how-to-guide'] as ArticleTemplate[],
    tone: 'Strategic and executive-level. Speak to decision-makers about AI transformation.',
    targetKeywords: [
      'digital transformation',
      'AI consulting',
      'technology strategy',
      'enterprise modernization',
      'AI ROI',
      'scaling operations',
      'technology roadmap',
      'innovation strategy',
      'competitive advantage',
      'business transformation',
    ],
  },

  'industry-news': {
    name: 'Industry News',
    categorySlug: 'industry-news',
    templates: ['news-analysis', 'market-analysis', 'prediction'] as ArticleTemplate[],
    tone: 'Timely and analytical. Provide expert commentary on AI and automation trends.',
    targetKeywords: [
      'AI trends',
      'automation trends',
      'industry analysis',
      'market insights',
      'AI market',
      'business technology trends',
      'future of work',
      'AI predictions',
      'enterprise technology',
      'SaaS trends',
    ],
  },

  'digital-assets': {
    name: 'Digital Assets',
    categorySlug: 'digital-assets',
    templates: ['explainer', 'market-analysis', 'news-analysis'] as ArticleTemplate[],
    tone: 'Analytical and data-driven. Explain complex digital asset concepts clearly.',
    targetKeywords: [
      'digital assets',
      'tokenization',
      'blockchain',
      'NFT utility',
      'real world assets',
      'DeFi',
      'crypto regulation',
      'asset tokenization',
    ],
  },
};

export function getPillar(slug: string): ContentPillar | undefined {
  return CONTENT_PILLARS[slug];
}

export function getAllPillars(): ContentPillar[] {
  return Object.values(CONTENT_PILLARS);
}

export function getPillarSlugs(): string[] {
  return Object.keys(CONTENT_PILLARS);
}

/**
 * Get the default template for a pillar
 */
export function getDefaultTemplate(pillarSlug: string): ArticleTemplate {
  const pillar = CONTENT_PILLARS[pillarSlug];
  if (!pillar) {
    throw new Error(`Unknown pillar: ${pillarSlug}`);
  }
  return pillar.templates[0];
}

/**
 * Validate that a template is valid for a pillar
 */
export function isValidTemplate(pillarSlug: string, template: ArticleTemplate): boolean {
  const pillar = CONTENT_PILLARS[pillarSlug];
  if (!pillar) return false;
  return pillar.templates.includes(template);
}
