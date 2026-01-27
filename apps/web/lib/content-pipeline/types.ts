/**
 * Shared content pipeline types.
 * Cron and Telegram use the same article shape, metadata, and publishing flow.
 */

export interface GeneratedArticle {
  title: string;
  slug: string;
  description: string;
  content: string;
}

export interface ContentPipelineInput {
  topic: string;
  pillar: string;
  template?: string;
  keywords?: string[];
  generateImage?: boolean;
}

export interface ContentPipelineResult {
  success: boolean;
  article?: GeneratedArticle;
  documentId?: string;
  slug?: string;
  hasCover?: boolean;
  error?: string;
}
