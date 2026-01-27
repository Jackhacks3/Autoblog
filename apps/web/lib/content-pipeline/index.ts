/**
 * Shared content pipeline for Cron and Telegram.
 * One flow: same article shape, image generation, Strapi payload, revalidation.
 */

import type { GeneratedArticle, ContentPipelineInput, ContentPipelineResult } from './types';

const STRAPI_URL = process.env.STRAPI_URL!;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const TEMPLATE_MAP: Record<string, string> = {
  'ai-automation': 'how-to-guide',
  'consulting': 'thought-leadership',
  'industry-news': 'news-analysis',
};

const IMAGE_PROMPT_SYSTEM = `You generate DALL-E 3 prompts for professional blog hero images. Given a structured article (JSON), output exactly one image prompt—nothing else, no explanation, no markdown.

Rules: Match the article's topic and key ideas. Use title, description, content.
Style: Modern, minimal, corporate. Colors: blues, teals, whites. No text, logos, faces, hands, clutter, or dark imagery.
Output only the raw DALL-E prompt, 2–4 sentences.`;

export async function generateArticle(params: {
  topic: string;
  pillar: string;
  template?: string;
  keywords?: string[];
}): Promise<GeneratedArticle> {
  const { topic, pillar, template, keywords } = params;
  const type = template ?? TEMPLATE_MAP[pillar] ?? 'how-to-guide';
  const kw = keywords?.length ? `\nKeywords to include: ${keywords.join(', ')}` : '';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Write a professional blog article.

Topic: ${topic}
Content Pillar: ${pillar}
Article Type: ${type}
Length: 1000-1500 words
Requirements:
- SEO-optimized title (50-60 characters)
- Practical, actionable content
- Clear structure with H2 headings
- Include examples and best practices
${kw}

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
  const text = (data.content?.[0]?.text ?? '').trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse article JSON');
  return JSON.parse(jsonMatch[0]) as GeneratedArticle;
}

export async function generateImagePrompt(article: GeneratedArticle): Promise<string> {
  const payload = {
    title: article.title,
    description: article.description,
    contentSnippet: article.content.replace(/\s+/g, ' ').trim().slice(0, 1200),
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      temperature: 0.4,
      system: IMAGE_PROMPT_SYSTEM,
      messages: [{
        role: 'user',
        content: `Article (JSON):\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\nGenerate a single DALL-E 3 image prompt. Output only the prompt.`,
      }],
    }),
  });

  if (!res.ok) throw new Error(`Claude image-prompt error: ${await res.text()}`);

  const data = await res.json();
  const raw = (data.content?.[0]?.text ?? '').trim().replace(/^["']|["']$/g, '');
  if (!raw || raw.length < 20) throw new Error('Empty or too-short image prompt');
  return raw;
}

export async function generateImageDallE(prompt: string): Promise<string> {
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

export async function uploadImageToStrapi(
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

export async function getCategoryId(pillar: string): Promise<string | null> {
  try {
    const q = new URLSearchParams({ 'filters[slug][$eq]': pillar });
    const res = await fetch(`${STRAPI_URL}/api/categories?${q}`, {
      headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
    });
    const data = await res.json();
    return data.data?.[0]?.documentId ?? null;
  } catch {
    return null;
  }
}

export async function publishArticle(
  article: GeneratedArticle,
  pillar: string,
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

  const categoryId = await getCategoryId(pillar);

  const dataBody: Record<string, unknown> = {
    title,
    slug: article.slug,
    description,
    blocks,
  };
  if (categoryId) dataBody.category = categoryId;
  if (coverDocumentId) dataBody.cover = { connect: [coverDocumentId] };

  // Use ?status=published so the post appears on the blog (list filters by published).
  // Body must not include status—Strapi Cloud rejects it; query param is for D&P.
  const createUrl = `${STRAPI_URL}/api/articles?status=published`;
  const res = await fetch(createUrl, {
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

async function revalidatePath(path: string): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return;
  const secret = process.env.REVALIDATION_SECRET;
  const url = secret
    ? `${siteUrl}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(path)}`
    : `${siteUrl}/api/revalidate?path=${encodeURIComponent(path)}`;
  try {
    await fetch(url, { method: 'POST' });
  } catch {
    /* ignore */
  }
}

export async function runRevalidation(slug?: string): Promise<void> {
  await revalidatePath('/blog');
  if (slug) await revalidatePath(`/blog/${slug}`);
}

/**
 * Single pipeline: generate article -> optional hero image -> publish -> revalidate.
 * Used by both Cron and Telegram. Same layout, metadata, and flow.
 */
export async function runContentPipeline(
  input: ContentPipelineInput
): Promise<ContentPipelineResult> {
  const { topic, pillar, template, keywords, generateImage = true } = input;

  if (!STRAPI_URL || !STRAPI_API_TOKEN || !ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: 'Missing STRAPI_URL, STRAPI_API_TOKEN, or ANTHROPIC_API_KEY',
    };
  }

  try {
    const article = await generateArticle({ topic, pillar, template, keywords });

    let coverDocumentId: string | null = null;

    if (generateImage && OPENAI_API_KEY) {
      try {
        const imagePrompt = await generateImagePrompt(article);
        const imageUrl = await generateImageDallE(imagePrompt);
        const filename = `${article.slug}-hero-${Date.now()}.png`;
        const altText = `Hero image for ${article.title}`;
        const media = await uploadImageToStrapi(imageUrl, filename, altText);
        coverDocumentId = media.documentId;
      } catch (e) {
        console.warn('Image generation or upload failed, publishing without cover:', e);
      }
    }

    const { documentId, slug } = await publishArticle(article, pillar, coverDocumentId);
    await runRevalidation(slug);

    return {
      success: true,
      article,
      documentId,
      slug,
      hasCover: !!coverDocumentId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
