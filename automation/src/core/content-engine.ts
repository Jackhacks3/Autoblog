/**
 * Content Engine
 *
 * Main orchestration for the content generation pipeline
 */

import { generateArticle } from '../generators/article-generator.js';
import { generateHeroImage, generateImageFilename } from '../generators/image-generator.js';
import { uploadImageFromUrl } from '../clients/strapi-media.js';
import {
  createArticle,
  getAIAuthor,
  findCategoryBySlug,
  healthCheck,
} from '../clients/strapi.js';
import { getPillar } from '../config/content-pillars.js';
import type {
  ArticleRequest,
  GeneratedArticle,
  GeneratedImage,
  StrapiArticle,
  PipelineResult,
} from '../types/index.js';

export interface ContentEngineOptions {
  generateImage?: boolean;
  publishStatus?: 'draft' | 'published';
  skipCms?: boolean;
}

export interface ContentResult {
  article: GeneratedArticle;
  image?: GeneratedImage;
  mediaId?: number;
  strapiArticle?: StrapiArticle;
}

/**
 * Run the full content generation pipeline
 */
export async function runPipeline(
  request: ArticleRequest,
  options: ContentEngineOptions = {}
): Promise<PipelineResult> {
  const stages: PipelineResult['stages'] = [];
  const errors: Error[] = [];
  let article: GeneratedArticle | undefined;
  let image: GeneratedImage | undefined;
  let mediaId: number | undefined;
  let strapiArticle: StrapiArticle | undefined;

  // Stage 1: Generate Article Content
  const articleStart = Date.now();
  try {
    article = await generateArticle(request);
    stages.push({
      name: 'generate-article',
      status: 'completed',
      duration: Date.now() - articleStart,
    });
  } catch (error) {
    stages.push({
      name: 'generate-article',
      status: 'failed',
      duration: Date.now() - articleStart,
    });
    errors.push(error as Error);
    return { success: false, errors, stages };
  }

  // Stage 2: Generate Hero Image (optional)
  if (options.generateImage !== false && article) {
    const imageStart = Date.now();
    try {
      image = await generateHeroImage(article);
      stages.push({
        name: 'generate-image',
        status: 'completed',
        duration: Date.now() - imageStart,
      });
    } catch (error) {
      stages.push({
        name: 'generate-image',
        status: 'failed',
        duration: Date.now() - imageStart,
      });
      errors.push(error as Error);
      // Continue without image
    }
  } else {
    stages.push({
      name: 'generate-image',
      status: 'skipped',
      duration: 0,
    });
  }

  // Skip CMS operations if requested
  if (options.skipCms) {
    stages.push({
      name: 'upload-image',
      status: 'skipped',
      duration: 0,
    });
    stages.push({
      name: 'publish-to-cms',
      status: 'skipped',
      duration: 0,
    });
    return {
      success: true,
      article: strapiArticle,
      errors,
      stages,
    };
  }

  // Stage 3: Upload Image to Strapi
  if (image && article) {
    const uploadStart = Date.now();
    try {
      const filename = generateImageFilename(article);
      const uploadedMedia = await uploadImageFromUrl(image.url, filename, image.altText);
      mediaId = uploadedMedia.id;
      stages.push({
        name: 'upload-image',
        status: 'completed',
        duration: Date.now() - uploadStart,
      });
    } catch (error) {
      stages.push({
        name: 'upload-image',
        status: 'failed',
        duration: Date.now() - uploadStart,
      });
      errors.push(error as Error);
      // Continue without image
    }
  } else {
    stages.push({
      name: 'upload-image',
      status: 'skipped',
      duration: 0,
    });
  }

  // Stage 4: Publish to Strapi CMS
  if (article) {
    const publishStart = Date.now();
    try {
      // Get AI author
      const author = await getAIAuthor();

      // Get category
      const pillar = getPillar(request.pillar);
      const category = pillar ? await findCategoryBySlug(pillar.categorySlug) : null;

      // Create article in Strapi Cloud with content in blocks
      strapiArticle = await createArticle({
        title: article.title,
        description: article.description,
        slug: article.slug,
        cover: mediaId,
        author: author?.documentId,
        category: category?.documentId,
        blocks: [
          {
            __component: 'shared.rich-text',
            body: article.content,
          },
        ],
      });

      stages.push({
        name: 'publish-to-cms',
        status: 'completed',
        duration: Date.now() - publishStart,
      });
    } catch (error) {
      stages.push({
        name: 'publish-to-cms',
        status: 'failed',
        duration: Date.now() - publishStart,
      });
      errors.push(error as Error);
      return { success: false, errors, stages };
    }
  }

  return {
    success: true,
    article: strapiArticle,
    errors,
    stages,
  };
}

/**
 * Generate article content only (no CMS publishing)
 */
export async function generateContent(request: ArticleRequest): Promise<ContentResult> {
  const article = await generateArticle(request);
  return { article };
}

/**
 * Generate article with image (no CMS publishing)
 */
export async function generateContentWithImage(request: ArticleRequest): Promise<ContentResult> {
  const article = await generateArticle(request);
  const image = await generateHeroImage(article);
  return { article, image };
}

/**
 * Check if the content engine is ready
 */
export async function checkHealth(): Promise<{
  strapi: boolean;
  ready: boolean;
}> {
  const strapiHealth = await healthCheck();
  return {
    strapi: strapiHealth,
    ready: strapiHealth,
  };
}
