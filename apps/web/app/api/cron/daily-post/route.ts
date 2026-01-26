/**
 * Daily Post Cron API Route
 *
 * Generates and publishes a daily blog post with a hero image.
 * Runs on schedule (Vercel Cron). No local execution required.
 *
 * Flow: topic -> article (Claude) -> image prompt (Claude) -> image (DALL-E)
 *       -> upload to Strapi -> create article with cover.
 */

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const IMAGE_PROMPT_SYSTEM = `You generate DALL-E 3 prompts for professional blog hero images. Given a structured article (JSON), output exactly one image prompt—nothing else, no explanation, no markdown.

Rules: Match the article's topic and key ideas. Use title, description, content.
Style: Modern, minimal, corporate. Colors: blues, teals, whites. No text, logos, faces, hands, clutter, or dark imagery.
Output only the raw DALL-E prompt, 2–4 sentences.`;

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

function selectTopic(): { topic: string; pillar: string } {
  const pillars = Object.keys(TOPICS) as (keyof typeof TOPICS)[];
  const weights = [6, 3, 1];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  let selectedPillar: keyof typeof TOPICS = 'ai-automation';
  for (let i = 0; i < pillars.length; i++) {
    const w = weights[i] ?? 0;
    const p = pillars[i];
    random -= w;
    if (random <= 0 && p) {
      selectedPillar = p;
      break;
    }
  }
  const topics = TOPICS[selectedPillar];
  const idx = Math.floor(Math.random() * topics.length);
  const topic = topics[idx] ?? topics[0] ?? 'AI Automation Best Practices';
  return { topic, pillar: selectedPillar };
}

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

  const res = await fetch('https://api.anthropic.com/v1/messages', {
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
}`,
      }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${await res.text()}`);

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse article JSON');
  return JSON.parse(jsonMatch[0]);
}

async function generateImagePromptFromArticle(article: {
  title: string;
  description: string;
  content: string;
}): Promise<string> {
  const payload = {
    title: article.title,
    description: article.description,
    contentSnippet: article.content.replace(/\s+/g, ' ').trim().slice(0, 1200),
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      temperature: 0.4,
      messages: [{
        role: 'user',
        content: `Article (JSON):\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\nGenerate a single DALL-E 3 image prompt. Output only the prompt.`,
      }],
      system: IMAGE_PROMPT_SYSTEM,
    }),
  });

  if (!res.ok) throw new Error(`Claude image-prompt error: ${await res.text()}`);

  const data = await res.json();
  const raw = (data.content?.[0]?.text ?? '').trim().replace(/^["']|["']$/g, '');
  if (!raw || raw.length < 20) throw new Error('Empty or too-short image prompt');
  return raw;
}

async function generateImageDallE(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      style: 'natural',
    }),
  });

  if (!res.ok) throw new Error(`DALL-E error: ${await res.text()}`);

  const data = await res.json();
  const url = data.data?.[0]?.url;
  if (!url) throw new Error('No image URL from DALL-E');
  return url;
}

async function uploadImageToStrapi(
  imageUrl: string,
  filename: string,
  altText: string
): Promise<{ id: number; documentId: string }> {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);

  const buf = await imgRes.arrayBuffer();
  const form = new FormData();
  const blob = new Blob([buf], { type: 'image/png' });
  form.append('files', blob, filename);
  form.append('fileInfo', JSON.stringify({ alternativeText: altText, caption: altText }));

  const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
    body: form,
  });

  if (!uploadRes.ok) throw new Error(`Strapi upload error: ${await uploadRes.text()}`);

  const uploaded = (await uploadRes.json()) as Array<{ id: number; documentId: string }>;
  const file = uploaded?.[0];
  if (!file?.id || !file?.documentId) throw new Error('No media returned from Strapi upload');
  return { id: file.id, documentId: file.documentId };
}

async function getCategoryId(slug: string): Promise<string | null> {
  try {
    const q = new URLSearchParams({ 'filters[slug][$eq]': slug });
    const res = await fetch(`${STRAPI_URL}/api/categories?${q}`, {
      headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
    });
    const data = await res.json();
    return data.data?.[0]?.documentId ?? null;
  } catch {
    return null;
  }
}

async function publishToStrapi(
  article: { title: string; slug: string; description: string; content: string },
  categoryId: string | null,
  coverDocumentId: string | null
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
  if (categoryId) dataBody.category = categoryId;
  if (coverDocumentId) dataBody.cover = { connect: [coverDocumentId] };

  const res = await fetch(`${STRAPI_URL}/api/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ data: dataBody }),
  });

  if (!res.ok) throw new Error(`Strapi error: ${await res.text()}`);

  const data = await res.json();
  return { documentId: data.data.documentId, slug: data.data.slug };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { topic, pillar } = selectTopic();
    const article = await generateArticle(topic, pillar);
    const categoryId = await getCategoryId(pillar);

    let coverDocumentId: string | null = null;

    if (OPENAI_API_KEY) {
      try {
        const imagePrompt = await generateImagePromptFromArticle(article);
        const imageUrl = await generateImageDallE(imagePrompt);
        const filename = `${article.slug}-hero-${Date.now()}.png`;
        const altText = `Hero image for ${article.title}`;
        const media = await uploadImageToStrapi(imageUrl, filename, altText);
        coverDocumentId = media.documentId;
      } catch (imgErr) {
        console.warn('Image generation or upload failed, publishing without cover:', imgErr);
      }
    } else {
      console.warn('OPENAI_API_KEY not set; skipping hero image');
    }

    const { documentId, slug } = await publishToStrapi(article, categoryId, coverDocumentId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const revalidationSecret = process.env.REVALIDATION_SECRET;
    if (siteUrl) {
      try {
        const revalidateUrl = revalidationSecret
          ? `${siteUrl}/api/revalidate?secret=${encodeURIComponent(revalidationSecret)}&path=/blog`
          : `${siteUrl}/api/revalidate?path=/blog`;
        await fetch(revalidateUrl, { method: 'POST' });
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      success: true,
      article: {
        title: article.title,
        slug,
        documentId,
        pillar,
        hasCover: !!coverDocumentId,
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

export { GET as POST };
