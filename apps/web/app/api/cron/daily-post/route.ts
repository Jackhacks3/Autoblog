/**
 * Daily Post Cron API Route
 *
 * Uses shared content pipeline. Same article shape, image, and flow as Telegram.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runContentPipeline } from '@/lib/content-pipeline';

export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

const TOPICS: Record<string, string[]> = {
  'ai-automation': [
    'How to Implement Claude AI for Customer Service Automation',
    'Building Intelligent Workflow Automation with LLMs',
    'AI-Powered Document Processing: A Complete Guide',
    'Automating Email Marketing with AI: Best Practices',
    'How to Build Custom GPT Agents for Your Business',
    'Prompt Engineering Techniques for Business Applications',
    'Building RAG Systems for Enterprise Knowledge Management',
    'AI-Driven Lead Scoring: Implementation Guide',
    'How to Create AI-Powered Sales Assistants',
    'Building Intelligent Chatbots for B2B Companies',
    'No-Code AI Tools for Small Business Automation',
    'How to Automate Report Generation with AI',
    'Building AI-Enhanced CRM Workflows',
    'AI for Marketing Automation: A Strategic Guide',
  ],
  'consulting': [
    'Digital Transformation Roadmap for AI Adoption',
    'Building an AI-First Culture in Your Organization',
    'Strategic Planning for Enterprise AI Implementation',
    'AI Governance: Best Practices for Enterprise Compliance',
    'Calculating AI ROI: A Framework for Business Leaders',
    'Scaling Operations Without Scaling Headcount',
  ],
  'industry-news': [
    'AI Trends: What Every Business Leader Should Know',
    'The Future of Work: AI and Automation Predictions',
    'Enterprise AI Market Analysis: Key Developments',
    'How Leading Companies Are Using AI for Competitive Advantage',
  ],
};

function selectTopic(): { topic: string; pillar: string } {
  const pillars = Object.keys(TOPICS) as (keyof typeof TOPICS)[];
  const weights = [6, 3, 1];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  let pillar: keyof typeof TOPICS = 'ai-automation';
  for (let i = 0; i < pillars.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) {
      pillar = pillars[i]!;
      break;
    }
  }
  const topics = TOPICS[pillar] ?? TOPICS['ai-automation']!;
  const topic = topics[Math.floor(Math.random() * topics.length)] ?? topics[0] ?? 'AI Automation Best Practices';
  return { topic, pillar };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { topic, pillar } = selectTopic();
  const result = await runContentPipeline({
    topic,
    pillar,
    generateImage: true,
  });

  if (!result.success) {
    console.error('Daily post error:', result.error);
    return NextResponse.json(
      { error: result.error, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    article: {
      title: result.article!.title,
      slug: result.slug,
      documentId: result.documentId,
      pillar,
      hasCover: result.hasCover,
    },
    timestamp: new Date().toISOString(),
  });
}

export { GET as POST };
