import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container-wide py-16">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          AI & Digital Assets Insights
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Expert perspectives on AI implementation, blockchain technology,
          and digital transformation for enterprise leaders.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Explore Articles
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* Content Pillars */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          What We Cover
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contentPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">{pillar.icon}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{pillar.title}</h3>
              <p className="text-sm text-gray-600">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Articles Placeholder */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Latest Articles</h2>
          <Link href="/blog" className="text-brand-600 hover:text-brand-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Placeholder cards - will be replaced with CMS data */}
          {[1, 2, 3].map((i) => (
            <article
              key={i}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video bg-gray-100" />
              <div className="p-6">
                <span className="text-xs font-medium text-brand-600 uppercase tracking-wide">
                  Category
                </span>
                <h3 className="font-semibold text-gray-900 mt-2 mb-2">
                  Article Title Placeholder {i}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  This is a placeholder for the article excerpt. It will be replaced with real content from the CMS.
                </p>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <span>5 min read</span>
                  <span className="mx-2">·</span>
                  <span>Jan 20, 2026</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const contentPillars = [
  {
    title: 'AI & Automation',
    description: 'Practical guides on LLM applications, workflow automation, and AI implementation.',
    icon: '🤖',
  },
  {
    title: 'Digital Assets',
    description: 'Tokenization strategies, blockchain technology, and digital ownership trends.',
    icon: '💎',
  },
  {
    title: 'Consulting Insights',
    description: 'Strategic frameworks, transformation roadmaps, and ROI analysis.',
    icon: '📊',
  },
  {
    title: 'Industry News',
    description: 'Timely analysis of AI and tech developments with expert commentary.',
    icon: '📰',
  },
];
