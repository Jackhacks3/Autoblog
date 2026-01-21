/**
 * Strapi CMS Write Client
 *
 * Handles content creation and publishing to Strapi Cloud
 */

import { getConfig } from '../config/index.js';
import type {
  StrapiArticleInput,
  StrapiArticle,
  StrapiAuthor,
  StrapiCategory,
} from '../types/index.js';

interface StrapiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

interface StrapiError {
  error: {
    status: number;
    name: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Make an authenticated request to Strapi
 */
async function strapiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getConfig();
  const url = `${config.strapi.url}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.strapi.apiToken}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as StrapiError;
    throw new Error(
      `Strapi API error (${response.status}): ${error.error?.message || 'Unknown error'}`
    );
  }

  return data as T;
}

// ============================================================================
// Article Operations
// ============================================================================

/**
 * Create a new article in Strapi
 */
export async function createArticle(input: StrapiArticleInput): Promise<StrapiArticle> {
  const response = await strapiRequest<StrapiResponse<StrapiArticle>>('/articles', {
    method: 'POST',
    body: JSON.stringify({ data: input }),
  });

  return response.data;
}

/**
 * Update an existing article
 */
export async function updateArticle(
  documentId: string,
  input: Partial<StrapiArticleInput>
): Promise<StrapiArticle> {
  const response = await strapiRequest<StrapiResponse<StrapiArticle>>(
    `/articles/${documentId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ data: input }),
    }
  );

  return response.data;
}

/**
 * Publish an article
 * Note: Strapi Cloud auto-publishes articles on creation
 * This function is a placeholder for self-hosted Strapi with status field
 */
export async function publishArticle(documentId: string): Promise<StrapiArticle> {
  // Strapi Cloud doesn't have a status field - articles are published by default
  // For self-hosted Strapi, uncomment: return updateArticle(documentId, { status: 'published' });
  const response = await strapiRequest<StrapiResponse<StrapiArticle>>(
    `/articles/${documentId}`
  );
  return response.data;
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(slug: string): Promise<StrapiArticle | null> {
  const response = await strapiRequest<StrapiResponse<StrapiArticle[]>>(
    `/articles?filters[slug][$eq]=${encodeURIComponent(slug)}`
  );

  return response.data[0] || null;
}

// ============================================================================
// Author Operations
// ============================================================================

/**
 * Find author by name
 */
export async function findAuthorByName(name: string): Promise<StrapiAuthor | null> {
  const response = await strapiRequest<StrapiResponse<StrapiAuthor[]>>(
    `/authors?filters[name][$eq]=${encodeURIComponent(name)}`
  );

  return response.data[0] || null;
}

/**
 * Get the AI author (AUTOBLOG AI)
 */
export async function getAIAuthor(): Promise<StrapiAuthor | null> {
  const config = getConfig();
  return findAuthorByName(config.defaults.authorName);
}

// ============================================================================
// Category Operations
// ============================================================================

/**
 * Find category by slug
 */
export async function findCategoryBySlug(slug: string): Promise<StrapiCategory | null> {
  const response = await strapiRequest<StrapiResponse<StrapiCategory[]>>(
    `/categories?filters[slug][$eq]=${encodeURIComponent(slug)}`
  );

  return response.data[0] || null;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<StrapiCategory[]> {
  const response = await strapiRequest<StrapiResponse<StrapiCategory[]>>('/categories');
  return response.data;
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check if Strapi is accessible
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const config = getConfig();
    const response = await fetch(`${config.strapi.url}/api/articles?pagination[limit]=1`, {
      headers: {
        Authorization: `Bearer ${config.strapi.apiToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
