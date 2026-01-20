import type { Article } from '@/lib/cms/types';

interface JsonLdProps {
  article: Article;
}

export function JsonLd({ article }: JsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage?.url || `${siteUrl}/og-default.png`,
    datePublished: article.publishedAt || undefined,
    dateModified: article.lastUpdated || article.publishedAt || undefined,
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author.name,
          url: `${siteUrl}/authors/${article.author.slug}`,
        }
      : {
          '@type': 'Organization',
          name: 'AUTOBLOG',
        },
    publisher: {
      '@type': 'Organization',
      name: 'AUTOBLOG',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${article.slug}`,
    },
    wordCount: article.content
      ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).length
      : undefined,
    articleSection: article.category?.name,
    keywords: article.tags.map((tag) => tag.name).join(', ') || undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
    />
  );
}

// Organization schema for the homepage/about page
export function OrganizationJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AUTOBLOG',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'Expert insights on AI implementation, digital assets, and technology consulting for enterprise leaders.',
    sameAs: [
      'https://twitter.com/autoblog',
      'https://linkedin.com/company/autoblog',
      'https://github.com/autoblog',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@autoblog.com',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
    />
  );
}

// Breadcrumb schema
interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
}
