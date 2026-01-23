#!/usr/bin/env node
/**
 * Test Article Creation Script
 * Tests creating an article in Strapi to debug issues
 */

// Try to load dotenv if available (optional)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, use environment variables directly
}

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function testArticleCreation() {
  console.log('\n🧪 Testing Article Creation in Strapi\n');
  console.log('='.repeat(50));

  if (!STRAPI_URL || !STRAPI_API_TOKEN) {
    console.error('❌ Missing STRAPI_URL or STRAPI_API_TOKEN');
    console.log('\nSet these environment variables:');
    console.log('  export STRAPI_URL=https://your-strapi-url.strapiapp.com');
    console.log('  export STRAPI_API_TOKEN=your_token\n');
    process.exit(1);
  }

  console.log(`\n📋 Configuration:`);
  console.log(`   STRAPI_URL: ${STRAPI_URL}`);
  console.log(`   STRAPI_API_TOKEN: ${STRAPI_API_TOKEN ? 'Set (' + STRAPI_API_TOKEN.substring(0, 10) + '...)' : 'Missing'}`);

  // Test article data - matching actual Strapi schema
  const testArticle = {
    title: 'Test Article from Script',
    slug: 'test-article-from-script-' + Date.now(),
    description: 'This is a test article to verify Strapi API is working correctly.',
    blocks: [
      {
        __component: 'shared.rich-text',
        body: 'This is test content for the article. It should be created successfully.',
      }
    ],
    // Note: status field doesn't exist - Strapi uses draftAndPublish
  };

  console.log(`\n📝 Test Article Data:`);
  console.log(`   Title: ${testArticle.title}`);
  console.log(`   Slug: ${testArticle.slug}`);
  console.log(`   Description: ${testArticle.description} (${testArticle.description.length} chars)`);
  console.log(`   Blocks: ${testArticle.blocks.length} block(s)`);

  try {
    console.log(`\n🔄 Sending request to: ${STRAPI_URL}/api/articles`);
    
    const response = await fetch(`${STRAPI_URL}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        data: testArticle,
      }),
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('\n❌ Failed to parse response as JSON:');
      console.error(responseText);
      return;
    }

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('\n❌ Article creation failed!');
      console.error('\nError Details:');
      console.error(JSON.stringify(data, null, 2));
      
      if (data.error) {
        console.error('\n🔍 Error Analysis:');
        console.error(`   Message: ${data.error.message || 'No message'}`);
        
        if (data.error.details) {
          console.error(`   Details:`);
          if (data.error.details.errors) {
            data.error.details.errors.forEach(err => {
              console.error(`     - ${err.path}: ${err.message}`);
            });
          } else {
            console.error(JSON.stringify(data.error.details, null, 2));
          }
        }
      }
      
      // Common issues
      if (response.status === 401) {
        console.error('\n💡 Fix: Check your STRAPI_API_TOKEN is valid and has write permissions');
      } else if (response.status === 403) {
        console.error('\n💡 Fix: API token may not have write permissions. Check token permissions in Strapi admin');
      } else if (response.status === 400) {
        console.error('\n💡 Fix: Check required fields and data format match Strapi schema');
      }
      
      return;
    }

    if (data.data) {
      console.log('\n✅ Article created successfully!');
      console.log(`\n📄 Article Details:`);
      console.log(`   ID: ${data.data.id || data.data.documentId || 'Unknown'}`);
      console.log(`   Document ID: ${data.data.documentId || data.data.id || 'Unknown'}`);
      console.log(`   Title: ${data.data.title || 'Unknown'}`);
      console.log(`   Slug: ${data.data.slug || 'Unknown'}`);
      console.log(`   Status: ${data.data.status || 'Unknown'}`);
      console.log(`   Created: ${data.data.createdAt || 'Unknown'}`);
      
      console.log(`\n🔗 View in Strapi Admin:`);
      console.log(`   ${STRAPI_URL}/admin/content-manager/collection-types/api::article.article/${data.data.id || data.data.documentId}`);
      
      console.log(`\n✅ Test passed! Article creation is working.\n`);
    } else {
      console.error('\n❌ Unexpected response format:');
      console.error(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Request failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  }
}

testArticleCreation();
