import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { AuthorBio } from '@/components/blog/AuthorBio';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { getArticleBySlug, getRelatedArticles, getAllArticleSlugs } from '@/lib/cms';

interface Props {
  params: { slug: string };
}

// Revalidate every 60 seconds
export const revalidate = 60;

// Generate static paths for all published articles
export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return { title: 'Article Not Found' };
  }

  const title = article.seo?.metaTitle || article.title;
  const description = article.seo?.metaDescription || article.excerpt;

  return {
    title,
    description,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.lastUpdated || undefined,
      authors: article.author ? [article.author.name] : undefined,
      images: article.featuredImage
        ? [
            {
              url: article.featuredImage.url,
              width: article.featuredImage.width,
              height: article.featuredImage.height,
              alt: article.featuredImage.alternativeText,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: article.featuredImage ? [article.featuredImage.url] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  // Fetch related articles
  const relatedArticles = article.category
    ? await getRelatedArticles(article.category.slug, article.slug, 3)
    : [];

  return (
    <>
      <JsonLd article={article} />

      <article className="container-blog py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li>
              <Link href="/" className="hover:text-gray-900">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/blog" className="hover:text-gray-900">
                Blog
              </Link>
            </li>
            {article.category && (
              <>
                <li>/</li>
                <li>
                  <Link
                    href={`/blog?category=${article.category.slug}`}
                    className="hover:text-gray-900"
                  >
                    {article.category.name}
                  </Link>
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          {article.category && (
            <div className="mb-4">
              <span
                className="inline-block px-3 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${article.category.color}20`,
                  color: article.category.color,
                }}
              >
                {article.category.name}
              </span>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>
          <p className="text-xl text-gray-600 mb-6">{article.excerpt}</p>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {article.author && (
                <>
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {article.author.avatar ? (
                      <Image
                        src={article.author.avatar.url}
                        alt={article.author.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {article.author.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {article.author.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {article.publishedAt &&
                        new Date(article.publishedAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      {' · '}
                      {article.readingTime} min read
                    </p>
                  </div>
                </>
              )}
            </div>
            <ShareButtons title={article.title} slug={article.slug} />
          </div>
        </header>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="aspect-video relative rounded-xl overflow-hidden mb-8">
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.alternativeText || article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="lg:flex lg:gap-12">
          {/* Table of Contents - Desktop Sidebar */}
          <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="sticky top-24">
              <TableOfContents content={article.content} />
            </div>
          </aside>

          {/* Article Content */}
          <div className="flex-1 min-w-0">
            <div
              className="prose prose-lg max-w-none prose-headings:scroll-mt-24"
              dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
            />

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/blog?tag=${tag.slug}`}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio */}
            {article.author && <AuthorBio author={article.author} />}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedArticles.length > 0 && (
        <RelatedPostsSection articles={relatedArticles} />
      )}
    </>
  );
}

function RelatedPostsSection({
  articles,
}: {
  articles: Awaited<ReturnType<typeof getRelatedArticles>>;
}) {
  return (
    <section className="bg-gray-50 py-12">
      <div className="container-wide">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Related Articles
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 mb-2 hover:text-brand-600">
                {article.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {article.excerpt}
              </p>
              <p className="text-sm text-gray-500">
                {article.readingTime} min read
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Format rich text content with proper HTML
function formatContent(content: string): string {
  if (!content) return '';

  // If content is already HTML, return as-is
  if (content.includes('<p>') || content.includes('<h')) {
    return content;
  }

  // Simple markdown-like formatting for plain text
  return content
    .replace(/^### (.*?)$/gm, '<h3 id="$1" class="text-xl font-semibold mt-6 mb-3">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 id="$1" class="text-2xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(?!<)/, '<p class="mb-4">')
    .replace(/(?!>)$/, '</p>');
}
