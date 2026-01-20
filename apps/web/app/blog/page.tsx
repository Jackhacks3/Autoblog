import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { getArticles, getCategories } from '@/lib/cms';
import type { Article, Category } from '@/lib/cms/types';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Explore our latest articles on AI, digital assets, and technology consulting.',
};

// Revalidate every 60 seconds
export const revalidate = 60;

interface PageProps {
  searchParams: { category?: string; tag?: string; page?: string };
}

export default async function BlogPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1;
  const category = searchParams.category;
  const tag = searchParams.tag;

  // Fetch articles and categories in parallel
  const [articlesResult, categories] = await Promise.all([
    getArticles({
      page,
      pageSize: 9,
      category,
      tag,
      status: 'published',
      sort: 'publishedAt:desc',
    }),
    getCategories(),
  ]);

  const { data: articles, pagination } = articlesResult;

  return (
    <div className="container-wide py-12">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Blog
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Expert insights on AI implementation, digital assets, and technology
          consulting for enterprise leaders.
        </p>
      </div>

      {/* Category Filters */}
      <CategoryFilters
        categories={categories}
        activeCategory={category}
      />

      {/* Articles Grid */}
      <Suspense fallback={<ArticleGridSkeleton />}>
        {articles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState category={category} tag={tag} />
        )}
      </Suspense>

      {/* Pagination */}
      {pagination.pageCount > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pageCount}
          category={category}
          tag={tag}
        />
      )}
    </div>
  );
}

function CategoryFilters({
  categories,
  activeCategory,
}: {
  categories: Category[];
  activeCategory?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Link
        href="/blog"
        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          !activeCategory
            ? 'bg-brand-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/blog?category=${category.slug}`}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
            activeCategory === category.slug
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={
            activeCategory === category.slug
              ? { backgroundColor: category.color }
              : undefined
          }
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  category,
  tag,
}: {
  currentPage: number;
  totalPages: number;
  category?: string;
  tag?: string;
}) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (tag) params.set('tag', tag);
    if (page > 1) params.set('page', String(page));
    const queryString = params.toString();
    return `/blog${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <div className="mt-12 flex justify-center">
      <nav className="flex items-center space-x-2">
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Previous
          </Link>
        ) : (
          <span className="px-4 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
            Previous
          </span>
        )}

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <Link
              key={pageNum}
              href={buildUrl(pageNum)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                pageNum === currentPage
                  ? 'text-white bg-brand-600'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {pageNum}
            </Link>
          );
        })}

        {currentPage < totalPages ? (
          <Link
            href={buildUrl(currentPage + 1)}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Next
          </Link>
        ) : (
          <span className="px-4 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
            Next
          </span>
        )}
      </nav>
    </div>
  );
}

function EmptyState({ category, tag }: { category?: string; tag?: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📝</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No articles found
      </h2>
      <p className="text-gray-600 mb-6">
        {category || tag
          ? 'No articles match your current filters.'
          : 'Check back soon for new content.'}
      </p>
      {(category || tag) && (
        <Link
          href="/blog"
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          View all articles
        </Link>
      )}
    </div>
  );
}

function ArticleGridSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse"
        >
          <div className="aspect-video bg-gray-200" />
          <div className="p-6">
            <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
            <div className="h-6 w-full bg-gray-200 rounded mb-2" />
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
