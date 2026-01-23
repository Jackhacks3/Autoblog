#!/usr/bin/env node
/**
 * List Articles Script
 * Lists all articles in Strapi to help find test articles
 */

// Try to load dotenv if available (optional)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, use environment variables directly
}

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function listArticles() {
  console.log('\n📋 Listing Articles from Strapi\n');
  console.log('='.repeat(50));

  if (!STRAPI_URL || !STRAPI_API_TOKEN) {
    console.error('❌ Missing STRAPI_URL or STRAPI_API_TOKEN');
    console.log('\nSet these environment variables:');
    console.log('  export STRAPI_URL=https://your-strapi-url.strapiapp.com');
    console.log('  export STRAPI_API_TOKEN=your_token\n');
    process.exit(1);
  }

  try {
    // Try to get both published and draft articles
    console.log(`\n🔍 Fetching articles from: ${STRAPI_URL}/api/articles\n`);

    const response = await fetch(`${STRAPI_URL}/api/articles?pagination[limit]=20&sort=createdAt:desc`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to fetch articles:');
      console.error(JSON.stringify(data, null, 2));
      return;
    }

    const articles = data.data || [];
    const meta = data.meta || {};

    console.log(`📊 Found ${articles.length} article(s) (Total: ${meta.pagination?.total || 0})\n`);

    if (articles.length === 0) {
      console.log('⚠️  No articles found. This could mean:');
      console.log('   1. No articles have been created yet');
      console.log('   2. Articles are filtered (check draft/published status)');
      console.log('   3. API token doesn\'t have read permissions');
      console.log('\n💡 Try creating a test article first:\n');
      console.log('   node scripts/test-article-creation.js\n');
      return;
    }

    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title || '(No title)'}`);
      console.log(`   ID: ${article.id}`);
      console.log(`   Document ID: ${article.documentId || 'N/A'}`);
      console.log(`   Slug: ${article.slug || 'N/A'}`);
      console.log(`   Description: ${(article.description || '').substring(0, 60)}...`);
      console.log(`   Created: ${article.createdAt || 'N/A'}`);
      console.log(`   Updated: ${article.updatedAt || 'N/A'}`);
      console.log(`   Published: ${article.publishedAt ? 'Yes (' + article.publishedAt + ')' : 'No (Draft)'}`);
      console.log(`   Admin URL: ${STRAPI_URL}/admin/content-manager/collection-types/api::article.article/${article.id}`);
      console.log('');
    });

    console.log('='.repeat(50));
    console.log('\n✅ Article listing complete!\n');

  } catch (error) {
    console.error('\n❌ Error fetching articles:');
    console.error(`   ${error.message}`);
  }
}

listArticles();
