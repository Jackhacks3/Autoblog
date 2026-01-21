/**
 * Strapi CMS Client
 *
 * Fetches content from Strapi 5.x CMS with proper typing and data transformation.
 */

import type {
  Article,
  Author,
  Category,
  Tag,
  MediaAsset,
  SEO,
  ArticleQueryParams,
  PaginatedResult,
  StrapiResponse,
  StrapiSingleResponse,
  StrapiArticle,
  StrapiAuthor,
  StrapiCategory,
  StrapiTag,
  StrapiMedia,
  StrapiSEO,
} from './types';

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// Revalidation time for ISR (in seconds)
const REVALIDATE_TIME = 60;

/**
 * Base fetch function with authentication and error handling
 */
async function strapiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  revalidate: number = REVALIDATE_TIME
): Promise<T> {
  const url = `${STRAPI_URL}/api${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(STRAPI_API_TOKEN && { Authorization: `Bearer ${STRAPI_API_TOKEN}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      next: { revalidate },
    });

    if (!response.ok) {
      console.error(`Strapi API error: ${response.status} ${response.statusText}`);
      throw new Error(`Strapi API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch from Strapi:', error);
    throw error;
  }
}

// ============================================================================
// Data Transformation Functions
// ============================================================================

function transformMedia(media: StrapiMedia | null): MediaAsset | null {
  if (!media) return null;

  return {
    url: media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`,
    alternativeText: media.alternativeText || '',
    width: media.width,
    height: media.height,
    formats: media.formats
      ? {
          thumbnail: media.formats.thumbnail
            ? {
                url: media.formats.thumbnail.url.startsWith('http')
                  ? media.formats.thumbnail.url
                  : `${STRAPI_URL}${media.formats.thumbnail.url}`,
                width: media.formats.thumbnail.width,
                height: media.formats.thumbnail.height,
              }
            : undefined,
          small: media.formats.small
            ? {
                url: media.formats.small.url.startsWith('http')
                  ? media.formats.small.url
                  : `${STRAPI_URL}${media.formats.small.url}`,
                width: media.formats.small.width,
                height: media.formats.small.height,
              }
            : undefined,
          medium: media.formats.medium
            ? {
                url: media.formats.medium.url.startsWith('http')
                  ? media.formats.medium.url
                  : `${STRAPI_URL}${media.formats.medium.url}`,
                width: media.formats.medium.width,
                height: media.formats.medium.height,
              }
            : undefined,
          large: media.formats.large
            ? {
                url: media.formats.large.url.startsWith('http')
                  ? media.formats.large.url
                  : `${STRAPI_URL}${media.formats.large.url}`,
                width: media.formats.large.width,
                height: media.formats.large.height,
              }
            : undefined,
        }
      : null,
  };
}

function transformSEO(seo: StrapiSEO | null): SEO | null {
  if (!seo) return null;

  return {
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    canonicalUrl: seo.canonicalUrl || null,
    ogImage: seo.ogImage ? transformMedia(seo.ogImage) : null,
    noIndex: seo.noIndex,
  };
}

function transformAuthor(author: StrapiAuthor | null | undefined): Author | null {
  if (!author) return null;

  // Generate slug from name if not provided (Strapi Cloud doesn't have slug)
  const slug = author.slug || author.name?.toLowerCase().replace(/\s+/g, '-') || '';

  return {
    id: author.documentId,
    name: author.name,
    slug,
    avatar: transformMedia(author.avatar || null),
    bio: author.bio || '',
    role: author.role || '',
    expertise: author.expertise || [],
    socialLinks: {
      linkedin: author.socialLinks?.linkedin || undefined,
      twitter: author.socialLinks?.twitter || undefined,
      github: author.socialLinks?.github || undefined,
    },
    isAI: author.isAI ?? false,
  };
}

function transformCategory(category: StrapiCategory | null | undefined): Category | null {
  if (!category) return null;

  return {
    id: category.documentId,
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    color: category.color || '#0ea5e9',
    icon: category.icon || null,
    parentCategory: category.parentCategory
      ? transformCategory(category.parentCategory)
      : null,
    seo: transformSEO(category.seo || null),
  };
}

function transformTag(tag: StrapiTag): Tag {
  return {
    id: tag.documentId,
    name: tag.name,
    slug: tag.slug,
    description: tag.description || '',
  };
}

function transformArticle(article: StrapiArticle): Article {
  // Handle Strapi Cloud vs self-hosted schema differences
  // Strapi Cloud: description, cover, blocks
  // Self-hosted: excerpt, featuredImage, content
  const excerpt = article.excerpt || article.description || '';

  // Extract content from blocks (Strapi Cloud) or use content field (self-hosted)
  let content = article.content || '';
  if (!content && article.blocks && Array.isArray(article.blocks)) {
    // Extract body from shared.rich-text blocks
    type RichTextBlock = { __component?: string; body?: string };
    const blocks = article.blocks as RichTextBlock[];
    content = blocks
      .filter((block) => block.__component === 'shared.rich-text' && block.body)
      .map((block) => block.body)
      .join('\n\n');
  }

  const featuredImage = article.featuredImage || article.cover || null;

  return {
    id: article.documentId,
    slug: article.slug,
    title: article.title,
    excerpt,
    content,
    featuredImage: transformMedia(featuredImage),
    author: transformAuthor(article.author),
    category: transformCategory(article.category),
    tags: (article.tags || []).map(transformTag),
    publishedAt: article.publishedAt,
    lastUpdated: article.lastUpdated || article.updatedAt,
    readingTime: article.readingTime || calculateReadingTime(content),
    status: article.status || 'published',
    seo: transformSEO(article.seo || null),
    aiGenerated: article.aiGenerated ?? false,
  };
}

// ============================================================================
// Article Functions
// ============================================================================

export async function getArticles(
  params: ArticleQueryParams = {}
): Promise<PaginatedResult<Article>> {
  const {
    page = 1,
    pageSize = 10,
    category,
    tag,
    author,
    status = 'published',
    sort = 'publishedAt:desc',
  } = params;

  const query = new URLSearchParams();
  query.set('pagination[page]', String(page));
  query.set('pagination[pageSize]', String(pageSize));
  query.set('sort', sort);
  // Populate relations - works for both Strapi Cloud and self-hosted
  query.set('populate', '*');

  // Only filter by status if explicitly requested (Strapi Cloud doesn't have status field)
  if (status && status !== 'published') {
    query.set('filters[status][$eq]', status);
  }

  // Filter by category slug
  if (category) {
    query.set('filters[category][slug][$eq]', category);
  }

  // Filter by tag slug
  if (tag) {
    query.set('filters[tags][slug][$eq]', tag);
  }

  // Filter by author slug
  if (author) {
    query.set('filters[author][slug][$eq]', author);
  }

  try {
    const response = await strapiFetch<StrapiResponse<StrapiArticle[]>>(
      `/articles?${query.toString()}`
    );

    return {
      data: response.data.map(transformArticle),
      pagination: response.meta.pagination || {
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total: response.data.length,
      },
    };
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return {
      data: [],
      pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 },
    };
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const query = new URLSearchParams();
  query.set('filters[slug][$eq]', slug);
  query.set('populate', '*');

  try {
    const response = await strapiFetch<StrapiResponse<StrapiArticle[]>>(
      `/articles?${query.toString()}`
    );

    if (!response.data || response.data.length === 0) {
      return null;
    }

    return transformArticle(response.data[0]!);
  } catch (error) {
    console.error('Failed to fetch article by slug:', error);
    return null;
  }
}

export async function getLatestArticles(limit: number = 3): Promise<Article[]> {
  const result = await getArticles({
    page: 1,
    pageSize: limit,
    status: 'published',
    sort: 'publishedAt:desc',
  });

  return result.data;
}

export async function getRelatedArticles(
  categorySlug: string,
  currentSlug: string,
  limit: number = 3
): Promise<Article[]> {
  const query = new URLSearchParams();
  query.set('pagination[page]', '1');
  query.set('pagination[pageSize]', String(limit + 1));
  query.set('sort', 'publishedAt:desc');
  query.set('filters[category][slug][$eq]', categorySlug);
  query.set('filters[slug][$ne]', currentSlug);
  query.set('populate', '*');

  try {
    const response = await strapiFetch<StrapiResponse<StrapiArticle[]>>(
      `/articles?${query.toString()}`
    );

    return response.data.slice(0, limit).map(transformArticle);
  } catch (error) {
    console.error('Failed to fetch related articles:', error);
    return [];
  }
}

// ============================================================================
// Category Functions
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  const query = new URLSearchParams();
  query.set('populate[seo][populate]', 'ogImage');
  query.set('populate[parentCategory]', '*');
  query.set('sort', 'name:asc');

  try {
    const response = await strapiFetch<StrapiResponse<StrapiCategory[]>>(
      `/categories?${query.toString()}`
    );

    return response.data.map((cat) => transformCategory(cat)!);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const query = new URLSearchParams();
  query.set('filters[slug][$eq]', slug);
  query.set('populate[seo][populate]', 'ogImage');
  query.set('populate[parentCategory]', '*');

  try {
    const response = await strapiFetch<StrapiResponse<StrapiCategory[]>>(
      `/categories?${query.toString()}`
    );

    if (!response.data || response.data.length === 0) {
      return null;
    }

    return transformCategory(response.data[0]!);
  } catch (error) {
    console.error('Failed to fetch category by slug:', error);
    return null;
  }
}

// ============================================================================
// Author Functions
// ============================================================================

export async function getAuthors(): Promise<Author[]> {
  const query = new URLSearchParams();
  query.set('populate', 'avatar,socialLinks');
  query.set('sort', 'name:asc');

  try {
    const response = await strapiFetch<StrapiResponse<StrapiAuthor[]>>(
      `/authors?${query.toString()}`
    );

    return response.data
      .map((author) => transformAuthor(author))
      .filter((a): a is Author => a !== null);
  } catch (error) {
    console.error('Failed to fetch authors:', error);
    return [];
  }
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const query = new URLSearchParams();
  query.set('filters[slug][$eq]', slug);
  query.set('populate', 'avatar,socialLinks');

  try {
    const response = await strapiFetch<StrapiResponse<StrapiAuthor[]>>(
      `/authors?${query.toString()}`
    );

    if (!response.data || response.data.length === 0) {
      return null;
    }

    return transformAuthor(response.data[0]!);
  } catch (error) {
    console.error('Failed to fetch author by slug:', error);
    return null;
  }
}

// ============================================================================
// Tag Functions
// ============================================================================

export async function getTags(): Promise<Tag[]> {
  const query = new URLSearchParams();
  query.set('sort', 'name:asc');

  try {
    const response = await strapiFetch<StrapiResponse<StrapiTag[]>>(
      `/tags?${query.toString()}`
    );

    return response.data.map(transformTag);
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return [];
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getMediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STRAPI_URL}${path}`;
}

export function calculateReadingTime(content: string): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// ============================================================================
// Static Generation Helpers
// ============================================================================

export async function getAllArticleSlugs(): Promise<string[]> {
  const query = new URLSearchParams();
  query.set('fields[0]', 'slug');
  query.set('pagination[pageSize]', '1000');

  try {
    const response = await strapiFetch<StrapiResponse<{ slug: string }[]>>(
      `/articles?${query.toString()}`,
      {},
      3600 // Cache for 1 hour
    );

    return response.data.map((article) => article.slug);
  } catch (error) {
    console.error('Failed to fetch article slugs:', error);
    return [];
  }
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const query = new URLSearchParams();
  query.set('fields[0]', 'slug');
  query.set('pagination[pageSize]', '100');

  try {
    const response = await strapiFetch<StrapiResponse<{ slug: string }[]>>(
      `/categories?${query.toString()}`,
      {},
      3600
    );

    return response.data.map((cat) => cat.slug);
  } catch (error) {
    console.error('Failed to fetch category slugs:', error);
    return [];
  }
}
