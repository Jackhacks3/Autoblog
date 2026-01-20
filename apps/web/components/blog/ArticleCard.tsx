import Link from 'next/link';
import Image from 'next/image';
import type { Article } from '@/lib/cms/types';

interface ArticleCardProps {
  article: Pick<Article, 'slug' | 'title' | 'excerpt' | 'publishedAt' | 'readingTime' | 'featuredImage'> & {
    category: { name: string; slug: string; color: string } | null;
    author: { name: string; avatar: { url: string } | null } | null;
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  const categoryColor = article.category?.color || '#6b7280';
  const authorName = article.author?.name || 'Anonymous';

  return (
    <article className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
      <Link href={`/blog/${article.slug}`}>
        {/* Image */}
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.alternativeText || article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-4xl opacity-30">📝</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {article.category && (
            <span
              className="inline-block px-2 py-1 text-xs font-medium rounded-full mb-3"
              style={{
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
              }}
            >
              {article.category.name}
            </span>
          )}

          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
            {article.title}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {article.excerpt}
          </p>

          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center">
              {article.author?.avatar ? (
                <Image
                  src={article.author.avatar.url}
                  alt={authorName}
                  width={24}
                  height={24}
                  className="rounded-full mr-2"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-medium text-gray-600">
                    {authorName.charAt(0)}
                  </span>
                </div>
              )}
              <span>{authorName}</span>
            </div>
            <span className="mx-2">·</span>
            <span>{article.readingTime} min</span>
            {article.publishedAt && (
              <>
                <span className="mx-2">·</span>
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
