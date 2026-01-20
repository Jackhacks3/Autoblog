export default function BlogLoading() {
  return (
    <div className="container-wide py-12">
      {/* Page Header Skeleton */}
      <div className="mb-12">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-6 w-96 max-w-full bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Category Filters Skeleton */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Articles Grid Skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="aspect-video bg-gray-200 animate-pulse" />
            <div className="p-6">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-6 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
