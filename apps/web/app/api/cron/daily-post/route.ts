/**
 * Daily Post Cron API Route
 *
 * Generates and publishes a daily blog post.
 * Can be triggered by:
 * - Vercel Cron
 * - GitHub Actions
 * - Manual HTTP request
 */

import { NextRequest, NextResponse } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET;
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Topic pool for daily posts
const TOPICS = {
  'ai-automation': [
    'How to Implement Claude AI for Customer Service Automation',
    'Building Intelligent Workflow Automation with LLMs',
    'AI-Powered Document Processing: A Complete Guide',
    'Automating Email Marketing with AI: Best Practices',
    'How to Build Custom GPT Agents for Your Business',
    'Prompt Engineering Techniques for Business Applications',
    'Building RAG Systems for Enterprise Knowledge Management',
    'AI-Driven Lead Scoring: Implementation Guide',
    'How to Create AI-Powered Sales Assistants',
    'Building Intelligent Chatbots for B2B Companies',
    'No-Code AI Tools for Small Business Automation',
    'How to Automate Report Generation with AI',
    'Building AI-Enhanced CRM Workflows',
    'AI for Marketing Automation: A Strategic Guide',
  ],
  'consulting': [
    'Digital Transformation Roadmap for AI Adoption',
    'Building an AI-First Culture in Your Organization',
    'Strategic Planning for Enterprise AI Implementation',
    'AI Governance: Best Practices for Enterprise Compliance',
    'Calculating AI ROI: A Framework for Business Leaders',
    'Scaling Operations Without Scaling Headcount',
  ],
  'industry-news': [
    'AI Trends: What Every Business Leader Should Know',
    'The Future of Work: AI and Automation Predictions',
    'Enterprise AI Market Analysis: Key Developments',
    'How Leading Companies Are Using AI for Competitive Advantage',
  ],
};

/**
 * Select random topic from pool
 */
function selectTopic(): { topic: string; pillar: string } {
  const pillars = Object.keys(TOPICS) as (keyof typeof TOPICS)[];
  const weights = [6, 3, 1]; // ai-automation, consulting, industry-news

  // Weighted random selection
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  let selectedPillar: keyof typeof TOPICS = 'ai-automation';
  for (let i = 0; i < pillars.length; i++) {
    const weight = weights[i] ?? 0;
    const pillar = pillars[i];
    random -= weight;
    if (random <= 0 && pillar) {
      selectedPillar = pillar;
      break;
    }
  }

  const topics = TOPICS[selectedPillar];
  const randomIndex = Math.floor(Math.random() * topics.length);
  const topic = topics[randomIndex] ?? topics[0] ?? 'AI Automation Best Practices';

  return { topic, pillar: selectedPillar };
}

/**
 * Generate article using Claude API
 */
async function generateArticle(topic: string, pillar: string): Promise<{
  title: string;
  slug: string;
  description: string;
  content: string;
}> {
  const templateMap: Record<string, string> = {
    'ai-automation': 'how-to-guide',
    'consulting': 'thought-leadership',
    'industry-news': 'news-analysis',
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Write a professional blog article.

Topic: ${topic}
Category: ${pillar}
Type: ${templateMap[pillar] || 'how-to-guide'}
Length: 1000-1500 words

Requirements:
- SEO-optimized title (50-60 characters)
- Practical, actionable content
- Clear structure with H2 headings
- Include examples and best practices

Return JSON only (no markdown code blocks):
{
  "title": "SEO optimized title",
  "slug": "url-friendly-slug",
  "description": "Brief meta description under 80 chars",
  "content": "Full article in Markdown format"
}`
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  // Extract JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse article JSON');

  return JSON.parse(jsonMatch[0]);
}

/**
 * Get category documentId from Strapi
 */
async function getCategoryId(slug: string): Promise<string | null> {
  try {
    const q = new URLSearchParams({ 'filters[slug][$eq]': slug });
    const response = await fetch(`${STRAPI_URL}/api/categories?${q}`, {
      headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
    });
    const data = await response.json();
    return data.data?.[0]?.documentId || null;
  } catch {
    return null;
  }
}

/**
 * Publish article to Strapi (payload matches Strapi Cloud schema)
 */
async function publishToStrapi(
  article: { title: string; slug: string; description: string; content: string },
  categoryId: string | null
): Promise<{ documentId: string; slug: string }> {
  const description = article.description.length > 80
    ? article.description.slice(0, 77) + '...'
    : article.description;
  const title = article.title.length > 100
    ? article.title.slice(0, 97) + '...'
    : article.title;

  const paragraphs = article.content.trim()
    ? article.content.split(/\n\n+/).filter((p) => p.trim().length > 0)
    : [];
  const blocks = paragraphs.length > 0
    ? paragraphs.map((p) => ({ __component: 'shared.rich-text' as const, body: p.trim() }))
    : [{ __component: 'shared.rich-text' as const, body: article.description || 'Article content' }];

  const dataBody: Record<string, unknown> = {
    title,
    slug: article.slug,
    description,
    blocks,
  };
  if (categoryId) {
    dataBody.category = categoryId; // many-to-one: use documentId directly
  }

  const response = await fetch(`${STRAPI_URL}/api/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ data: dataBody }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Strapi error: ${err}`);
  }

  const data = await response.json();
  return {
    documentId: data.data.documentId,
    slug: data.data.slug,
  };
}

/**
 * POST/GET handler for cron trigger
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Select topic
    const { topic, pillar } = selectTopic();

    // Generate article
    const article = await generateArticle(topic, pillar);

    // Get category
    const categoryId = await getCategoryId(pillar);

    // Publish
    const { documentId, slug } = await publishToStrapi(article, categoryId);

    return NextResponse.json({
      success: true,
      article: {
        title: article.title,
        slug,
        documentId,
        pillar,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Daily post error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export { GET as POST };
