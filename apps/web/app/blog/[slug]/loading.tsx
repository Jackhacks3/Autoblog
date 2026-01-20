export default function ArticleLoading() {
  return (
    <article className="container-blog py-12">
      {/* Breadcrumb Skeleton */}
      <nav className="mb-8">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <span className="text-gray-300">/</span>
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <span className="text-gray-300">/</span>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </nav>

      {/* Article Header Skeleton */}
      <header className="mb-8">
        <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse mb-4" />
        <div className="h-10 w-full max-w-2xl bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-6 w-full max-w-xl bg-gray-200 rounded animate-pulse mb-6" />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </header>

      {/* Featured Image Skeleton */}
      <div className="aspect-video bg-gray-200 rounded-xl animate-pulse mb-8" />

      <div className="lg:flex lg:gap-12">
        {/* Table of Contents Skeleton */}
        <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <div className="sticky top-24">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-4 bg-gray-200 rounded animate-pulse mb-3"
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        </aside>

        {/* Article Content Skeleton */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4">
            {/* Paragraphs */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i}>
                {i % 3 === 0 ? (
                  // Heading
                  <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse mt-8 mb-4" />
                ) : (
                  // Paragraph
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tags Skeleton */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Author Bio Skeleton */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
