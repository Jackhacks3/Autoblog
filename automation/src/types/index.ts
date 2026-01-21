/**
 * Content Automation Engine Type Definitions
 */

// ============================================================================
// Content Generation Types
// ============================================================================

export interface ContentPillar {
  name: string;
  categorySlug: string;
  templates: ArticleTemplate[];
  tone: string;
  targetKeywords: string[];
}

export type ArticleTemplate =
  | 'how-to-guide'
  | 'tutorial'
  | 'news-analysis'
  | 'market-analysis'
  | 'thought-leadership'
  | 'explainer'
  | 'prediction'
  | 'framework';

export interface ArticleRequest {
  topic: string;
  pillar: string;
  template?: ArticleTemplate;
  keywords?: string[];
  targetLength?: 'short' | 'medium' | 'long';
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  description: string;  // Max 80 chars for Strapi Cloud
  excerpt: string;      // Longer version for display
  content: string;      // Markdown content
  tags: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
  };
  readingTime: number;
  pillar: string;
  template: ArticleTemplate;
}

// ============================================================================
// Image Generation Types
// ============================================================================

export interface ImageRequest {
  article: GeneratedArticle;
  style?: 'natural' | 'vivid';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  altText: string;
  dimensions: {
    width: number;
    height: number;
  };
}

// ============================================================================
// Strapi Types
// ============================================================================

export interface StrapiArticleInput {
  title: string;
  description: string;
  slug: string;
  cover?: number;           // Media ID
  author?: string;          // Document ID
  category?: string;        // Document ID
  blocks?: StrapiBlock[];   // Rich content blocks
}

// Strapi Cloud blocks format
export interface StrapiBlock {
  __component: string;
  body?: string;  // For rich-text blocks
}

export interface StrapiMediaUpload {
  id: number;
  documentId: string;
  name: string;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
}

export interface StrapiAuthor {
  id: number;
  documentId: string;
  name: string;
  email?: string;
  isAI?: boolean;
}

export interface StrapiCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

export interface StrapiArticle {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Pipeline Types
// ============================================================================

export interface PipelineContext {
  request: ArticleRequest;
  article?: GeneratedArticle;
  image?: GeneratedImage;
  mediaId?: number;
  strapiArticle?: StrapiArticle;
  errors: Error[];
}

export interface PipelineStage {
  name: string;
  execute: (context: PipelineContext) => Promise<PipelineContext>;
  rollback?: (context: PipelineContext) => Promise<void>;
}

export interface PipelineResult {
  success: boolean;
  article?: StrapiArticle;
  errors: Error[];
  stages: {
    name: string;
    status: 'completed' | 'failed' | 'skipped';
    duration: number;
  }[];
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AutomationConfig {
  strapi: {
    url: string;
    apiToken: string;
  };
  anthropic: {
    apiKey: string;
    model: string;
  };
  openai: {
    apiKey: string;
  };
  telegram?: {
    botToken: string;
    allowedUsers?: number[];
  };
  defaults: {
    authorName: string;
    status: 'draft' | 'published';
  };
}

// ============================================================================
// Article Analysis Types (for Telegram integration)
// ============================================================================

export interface ArticleAnalysis {
  title: string;
  topic: string;
  keyPoints: string[];
  suggestedPillar: string;
  suggestedTemplate: ArticleTemplate;
  keywords: string[];
  tone: string;
  targetAudience: string;
}
