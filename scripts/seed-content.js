/**
 * Seed Content Script for AUTOBLOG
 * Creates categories, authors, and sample articles in Strapi Cloud
 */

const STRAPI_URL = 'https://methodical-star-1c2c084d0b.strapiapp.com';
const API_TOKEN = 'ff5cff54c5019d47ade82e07bd9d4fd679254fdebcddfc059860d40fd4435d1296b5eaf189b04f519664875be7cb1bd1b876176d2d741e5a0c72f1d4e25bbe31e1458a24f973253676bd76f82ae3ff9044a5703960606f9a03bcd929eb78840bdb73e55c262ef4728754e309f9752ec2c7e0add43d355139b7bce72eca47fed7';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
};

// Seed Data - matches Strapi Cloud default blog schema
const categories = [
  {
    name: 'AI & Automation',
    slug: 'ai-automation',
    description: 'Explore the latest in artificial intelligence, machine learning, and workflow automation.'
  },
  {
    name: 'Digital Assets',
    slug: 'digital-assets',
    description: 'Insights on blockchain, tokenization, NFTs, and digital asset management.'
  },
  {
    name: 'Consulting Insights',
    slug: 'consulting',
    description: 'Strategic frameworks, transformation guides, and ROI analysis for enterprise leaders.'
  },
  {
    name: 'Industry News',
    slug: 'industry-news',
    description: 'Breaking news and analysis of the latest tech industry developments.'
  }
];

const authors = [
  {
    name: 'Alex Chen',
    email: 'alex.chen@autoblog.com'
  },
  {
    name: 'Sarah Miller',
    email: 'sarah.miller@autoblog.com'
  },
  {
    name: 'AUTOBLOG AI',
    email: 'ai@autoblog.com'
  }
];

// Articles with Strapi Cloud default schema (title, description, slug)
// Note: description must be <= 80 characters for Strapi Cloud
const articles = [
  {
    title: 'Getting Started with LLM Integration in Enterprise Applications',
    slug: 'getting-started-with-llm-integration',
    description: 'A practical guide to implementing LLMs in enterprise tech stacks.',
    categorySlug: 'ai-automation',
    authorName: 'Alex Chen'
  },
  {
    title: 'Tokenization of Real World Assets: A 2026 Outlook',
    slug: 'tokenization-real-world-assets',
    description: 'How blockchain is transforming ownership of physical assets.',
    categorySlug: 'digital-assets',
    authorName: 'Sarah Miller'
  },
  {
    title: 'Measuring AI Transformation ROI: A Framework for CTOs',
    slug: 'ai-transformation-roi-framework',
    description: 'Quantifying AI investment value with concrete metrics and benchmarks.',
    categorySlug: 'consulting',
    authorName: 'Alex Chen'
  },
  {
    title: 'Claude 4 Announcement: What It Means for Enterprise AI',
    slug: 'claude-4-announcement-analysis',
    description: 'Breaking down Anthropic\'s latest release for business applications.',
    categorySlug: 'industry-news',
    authorName: 'AUTOBLOG AI'
  }
];

async function createEntry(endpoint, data) {
  try {
    const response = await fetch(`${STRAPI_URL}/api/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`Failed to create ${endpoint}:`, result.error?.message || result);
      return null;
    }

    console.log(`✓ Created ${endpoint}: ${data.name || data.title}`);
    return result.data;
  } catch (error) {
    console.error(`Error creating ${endpoint}:`, error.message);
    return null;
  }
}

async function getEntries(endpoint) {
  try {
    const response = await fetch(`${STRAPI_URL}/api/${endpoint}`, { headers });
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return [];
  }
}

async function seed() {
  console.log('\n🌱 Starting AUTOBLOG seed process...\n');

  // Create Categories
  console.log('📁 Creating categories...');
  const createdCategories = {};
  for (const category of categories) {
    const existing = await getEntries(`categories?filters[slug][$eq]=${category.slug}`);
    if (existing.length > 0) {
      console.log(`  - Category "${category.name}" already exists`);
      createdCategories[category.slug] = existing[0];
    } else {
      const created = await createEntry('categories', category);
      if (created) createdCategories[category.slug] = created;
    }
  }

  // Create Authors
  console.log('\n👤 Creating authors...');
  const createdAuthors = {};
  for (const author of authors) {
    const existing = await getEntries(`authors?filters[slug][$eq]=${author.slug}`);
    if (existing.length > 0) {
      console.log(`  - Author "${author.name}" already exists`);
      createdAuthors[author.slug] = existing[0];
    } else {
      const created = await createEntry('authors', author);
      if (created) createdAuthors[author.slug] = created;
    }
  }

  // Create Articles
  console.log('\n📝 Creating articles...');
  for (const article of articles) {
    const existing = await getEntries(`articles?filters[slug][$eq]=${article.slug}`);
    if (existing.length > 0) {
      console.log(`  - Article "${article.title}" already exists`);
      continue;
    }

    const articleData = {
      title: article.title,
      slug: article.slug,
      description: article.description
    };

    await createEntry('articles', articleData);
  }

  console.log('\n✅ Seed process complete!\n');

  // Verify
  const articleCount = await getEntries('articles');
  const categoryCount = await getEntries('categories');
  const authorCount = await getEntries('authors');

  console.log('📊 Summary:');
  console.log(`   Categories: ${categoryCount.length}`);
  console.log(`   Authors: ${authorCount.length}`);
  console.log(`   Articles: ${articleCount.length}`);
  console.log('\n🚀 You can now start the frontend with: npm run web:dev\n');
}

seed().catch(console.error);
