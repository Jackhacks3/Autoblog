/**
 * Article Analyzer Service
 *
 * Fetches and analyzes articles from URLs to extract topics and generate similar content
 */

import * as cheerio from 'cheerio';
import { generateStructuredContent } from '../clients/anthropic.js';
import type { ArticleAnalysis } from '../types/index.js';

interface FetchedArticle {
  title: string;
  content: string;
  url: string;
}

/**
 * Fetch and parse article content from a URL
 */
export async function fetchArticleContent(url: string): Promise<FetchedArticle> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ads, .comments, .sidebar').remove();

    // Try to get the title
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text() ||
      'Untitled Article';

    // Try to get the main content
    let content = '';

    // Common article content selectors
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      'main',
      '.post',
      '#content',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 200) break;
      }
    }

    // Fallback to body text
    if (content.length < 200) {
      content = $('body').text().trim();
    }

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .slice(0, 10000); // Limit content length

    return {
      title: title.trim(),
      content,
      url,
    };
  } catch (error) {
    throw new Error(`Failed to fetch article: ${(error as Error).message}`);
  }
}

/**
 * Analyze article content using Claude to extract topics and suggest generation parameters
 */
export async function analyzeArticle(article: FetchedArticle): Promise<ArticleAnalysis> {
  const systemPrompt = `You are an expert content analyst. Analyze the provided article and extract key information to help generate a similar but original article.

Your analysis should identify:
1. The main topic and angle
2. Key points covered
3. Which content pillar it fits (ai-automation, digital-assets, consulting, industry-news)
4. The most appropriate article template
5. Relevant keywords for SEO
6. The writing tone and target audience

Available pillars:
- ai-automation: AI tools, LLMs, automation workflows, chatbots, machine learning applications
- digital-assets: Cryptocurrency, blockchain, tokenization, NFTs, Web3
- consulting: Business strategy, digital transformation, ROI analysis, frameworks
- industry-news: Tech news, AI developments, market trends, company announcements

Available templates:
- how-to-guide: Step-by-step tutorials
- tutorial: In-depth technical guides
- news-analysis: Analysis of current events/trends
- market-analysis: Market trends and data analysis
- thought-leadership: Expert opinions and predictions
- explainer: Educational content explaining concepts
- prediction: Future trends and forecasts
- framework: Strategic frameworks and methodologies

Respond with a JSON object.`;

  const userPrompt = `Analyze this article and provide suggestions for generating similar content:

Title: ${article.title}

Content:
${article.content}

URL: ${article.url}

Respond with JSON in this exact format:
{
  "title": "A new suggested title for a similar article (not a copy)",
  "topic": "The main topic to write about",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "suggestedPillar": "ai-automation|digital-assets|consulting|industry-news",
  "suggestedTemplate": "how-to-guide|tutorial|news-analysis|market-analysis|thought-leadership|explainer|prediction|framework",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "tone": "Description of the writing tone",
  "targetAudience": "Who this content is for"
}`;

  const analysis = await generateStructuredContent<ArticleAnalysis>(
    systemPrompt,
    userPrompt,
    { maxTokens: 1500 }
  );

  // Validate the response
  if (!analysis.topic || !analysis.suggestedPillar || !analysis.suggestedTemplate) {
    throw new Error('Invalid analysis response from Claude');
  }

  return analysis;
}

/**
 * Analyze plain text content (for direct text input instead of URL)
 */
export async function analyzeText(text: string): Promise<ArticleAnalysis> {
  const fakeArticle: FetchedArticle = {
    title: 'User Submitted Content',
    content: text.slice(0, 10000),
    url: '',
  };

  return analyzeArticle(fakeArticle);
}

/**
 * Generate a topic description combining analysis with user preferences
 */
export function buildTopicFromAnalysis(
  analysis: ArticleAnalysis,
  customTopic?: string
): string {
  if (customTopic) {
    return customTopic;
  }

  const keyPointsSummary = analysis.keyPoints.slice(0, 3).join(', ');
  return `${analysis.topic}. Focus on: ${keyPointsSummary}. Target audience: ${analysis.targetAudience}`;
}
