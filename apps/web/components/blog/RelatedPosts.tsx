import Link from 'next/link';
import Image from 'next/image';
import { getRelatedArticles } from '@/lib/cms';
import type { Article } from '@/lib/cms/types';

interface RelatedPostsProps {
  categorySlug: string;
  currentSlug: string;
  limit?: number;
}

// Async server component that fetches related posts
export async function RelatedPosts({
  categorySlug,
  currentSlug,
  limit = 3,
}: RelatedPostsProps) {
  const relatedPosts = await getRelatedArticles(categorySlug, currentSlug, limit);

  if (relatedPosts.length === 0) return null;

  return (
    <section className="bg-gray-50 py-12">
      <div className="container-wide">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Related Articles
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {relatedPosts.map((post) => (
            <RelatedPostCard key={post.id} article={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Client component for the individual card
function RelatedPostCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="block bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
    >
      {/* Thumbnail */}
      {article.featuredImage && (
        <div className="aspect-video relative">
          <Image
            src={
              article.featuredImage.formats?.small?.url ||
              article.featuredImage.url
            }
            alt={article.featuredImage.alternativeText || article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6">
        {article.category && (
          <span
            className="inline-block px-2 py-1 text-xs font-medium rounded-full mb-2"
            style={{
              backgroundColor: `${article.category.color}20`,
              color: article.category.color,
            }}
          >
            {article.category.name}
          </span>
        )}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-600">
          {article.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {article.excerpt}
        </p>
        <p className="text-sm text-gray-500">{article.readingTime} min read</p>
      </div>
    </Link>
  );
}

// Non-async version that accepts pre-fetched articles
export function RelatedPostsStatic({
  articles,
  title = 'Related Articles',
}: {
  articles: Article[];
  title?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="bg-gray-50 py-12">
      <div className="container-wide">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((post) => (
            <RelatedPostCard key={post.id} article={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
