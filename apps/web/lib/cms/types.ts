// CMS Type Definitions - Strapi 5.x API responses

// Strapi 5.x response structure
export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiSingleResponse<T> {
  data: T | null;
  meta: Record<string, unknown>;
}

// Strapi 5.x uses documentId instead of id for relations
export interface StrapiDocument {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Raw Strapi types (as returned from API)
// Compatible with both Strapi Cloud (simpler) and self-hosted (full) schemas
export interface StrapiArticle extends StrapiDocument {
  title: string;
  slug: string;
  // Strapi Cloud uses 'description', self-hosted uses 'excerpt'
  description?: string;
  excerpt?: string;
  // Strapi Cloud uses 'blocks', self-hosted uses 'content'
  blocks?: unknown[];
  content?: string;
  // Strapi Cloud uses 'cover', self-hosted uses 'featuredImage'
  cover?: StrapiMedia | null;
  featuredImage?: StrapiMedia | null;
  author?: StrapiAuthor | null;
  category?: StrapiCategory | null;
  tags?: StrapiTag[];
  status?: 'draft' | 'in_review' | 'scheduled' | 'published';
  seo?: StrapiSEO | null;
  readingTime?: number | null;
  lastUpdated?: string | null;
  aiGenerated?: boolean;
}

export interface StrapiAuthor extends StrapiDocument {
  name: string;
  // Strapi Cloud uses 'email' only, self-hosted has more fields
  email?: string;
  slug?: string;
  avatar?: StrapiMedia | null;
  bio?: string | null;
  role?: string | null;
  expertise?: string[] | null;
  socialLinks?: StrapiSocialLinks | null;
  isAI?: boolean;
}

export interface StrapiCategory extends StrapiDocument {
  name: string;
  slug: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  parentCategory?: StrapiCategory | null;
  seo?: StrapiSEO | null;
}

export interface StrapiTag extends StrapiDocument {
  name: string;
  slug: string;
  description: string | null;
}

export interface StrapiSEO {
  id: number;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImage: StrapiMedia | null;
  noIndex: boolean;
}

export interface StrapiSocialLinks {
  id: number;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
}

export interface StrapiMedia {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  url: string;
  formats: {
    thumbnail?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    large?: StrapiMediaFormat;
  } | null;
}

export interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
}

// Normalized types for frontend use
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: MediaAsset | null;
  author: Author | null;
  category: Category | null;
  tags: Tag[];
  publishedAt: string | null;
  lastUpdated: string | null;
  readingTime: number;
  status: 'draft' | 'in_review' | 'scheduled' | 'published';
  seo: SEO | null;
  aiGenerated: boolean;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  avatar: MediaAsset | null;
  bio: string;
  role: string;
  expertise: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  isAI: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string | null;
  parentCategory: Category | null;
  seo: SEO | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface SEO {
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImage: MediaAsset | null;
  noIndex: boolean;
}

export interface MediaAsset {
  url: string;
  alternativeText: string;
  width: number;
  height: number;
  formats: {
    thumbnail?: MediaFormat;
    small?: MediaFormat;
    medium?: MediaFormat;
    large?: MediaFormat;
  } | null;
}

export interface MediaFormat {
  url: string;
  width: number;
  height: number;
}

// API Query Parameters
export interface ArticleQueryParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  author?: string;
  status?: Article['status'];
  sort?: 'publishedAt:desc' | 'publishedAt:asc' | 'title:asc' | 'title:desc';
}

// Pagination result
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}
