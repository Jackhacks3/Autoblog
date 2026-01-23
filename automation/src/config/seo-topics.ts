/**
 * SEO Topic Bank
 *
 * Pre-defined SEO-optimized topics for AI/Automation consulting blog
 * Topics rotate daily to ensure consistent, relevant content
 */

export interface SEOTopic {
  topic: string;
  pillar: string;
  template: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * Topic bank organized by content pillar
 * Each topic is designed for SEO and relevance to AI/Automation consulting
 *
 * Pillars (must match content-pillars.ts):
 * - ai-automation: AI & Automation (how-to guides, tutorials)
 * - consulting: Consulting Insights (frameworks, thought leadership, strategic content)
 * - industry-news: Industry News (news analysis, predictions)
 * - digital-assets: Digital Assets (explainers, market analysis)
 */
export const SEO_TOPIC_BANK: SEOTopic[] = [
  // AI & Automation Pillar - How-to guides and tutorials
  {
    topic: 'How to Automate Your Business Workflows with AI in 2026',
    pillar: 'ai-automation',
    template: 'how-to-guide',
    keywords: ['workflow automation', 'AI automation', 'business efficiency'],
    priority: 'high',
  },
  {
    topic: 'Building Your First AI-Powered Chatbot: A Step-by-Step Guide',
    pillar: 'ai-automation',
    template: 'tutorial',
    keywords: ['AI chatbot', 'chatbot development', 'customer service AI'],
    priority: 'high',
  },
  {
    topic: 'Integrating Claude API into Your Enterprise Applications',
    pillar: 'ai-automation',
    template: 'how-to-guide',
    keywords: ['Claude API', 'enterprise AI', 'LLM integration'],
    priority: 'high',
  },
  {
    topic: 'Automating Document Processing with AI: Complete Guide',
    pillar: 'ai-automation',
    template: 'how-to-guide',
    keywords: ['document automation', 'AI document processing', 'OCR AI'],
    priority: 'medium',
  },
  {
    topic: 'How to Use AI for Email Marketing Automation',
    pillar: 'ai-automation',
    template: 'how-to-guide',
    keywords: ['email automation', 'AI marketing', 'marketing automation'],
    priority: 'medium',
  },
  {
    topic: 'Prompt Engineering Best Practices for Business Applications',
    pillar: 'ai-automation',
    template: 'tutorial',
    keywords: ['prompt engineering', 'AI prompts', 'LLM optimization'],
    priority: 'high',
  },
  {
    topic: 'Building AI-Powered Sales Pipelines That Convert',
    pillar: 'ai-automation',
    template: 'how-to-guide',
    keywords: ['AI sales', 'sales automation', 'lead scoring AI'],
    priority: 'high',
  },
  {
    topic: 'How to Automate Customer Support with AI Agents',
    pillar: 'ai-automation',
    template: 'how-to-guide',
    keywords: ['AI customer support', 'support automation', 'AI agents'],
    priority: 'medium',
  },
  {
    topic: 'Creating Automated Content Workflows with AI',
    pillar: 'ai-automation',
    template: 'tutorial',
    keywords: ['content automation', 'AI content', 'automated writing'],
    priority: 'medium',
  },
  {
    topic: 'AI-Powered Data Entry Automation: Eliminate Manual Work',
    pillar: 'ai-automation',
    template: 'how-to-guide',
    keywords: ['data entry automation', 'AI data processing', 'RPA AI'],
    priority: 'medium',
  },
  {
    topic: 'No-Code AI Automation Tools for Small Businesses',
    pillar: 'ai-automation',
    template: 'explainer',
    keywords: ['no-code automation', 'small business AI', 'AI tools'],
    priority: 'high',
  },
  {
    topic: 'GPT Integration Patterns for Enterprise Applications',
    pillar: 'ai-automation',
    template: 'tutorial',
    keywords: ['GPT integration', 'enterprise AI', 'OpenAI API'],
    priority: 'medium',
  },

  // Consulting Pillar - Frameworks, thought leadership, and process optimization
  {
    topic: 'Achieving 73% Reduction in Manual Operations with AI',
    pillar: 'consulting',
    template: 'framework',
    keywords: ['operational efficiency', 'reduce manual work', 'AI productivity'],
    priority: 'high',
  },
  {
    topic: 'The Complete Guide to Process Optimization with AI',
    pillar: 'consulting',
    template: 'how-to-guide',
    keywords: ['process optimization', 'workflow optimization', 'business operations'],
    priority: 'high',
  },
  {
    topic: 'Measuring ROI on AI Automation Investments',
    pillar: 'consulting',
    template: 'framework',
    keywords: ['AI ROI', 'automation ROI', 'technology investment'],
    priority: 'high',
  },
  {
    topic: 'Building a Business Case for AI Automation',
    pillar: 'consulting',
    template: 'thought-leadership',
    keywords: ['AI business case', 'automation justification', 'technology adoption'],
    priority: 'medium',
  },
  {
    topic: 'Team Productivity Gains Through Intelligent Automation',
    pillar: 'consulting',
    template: 'framework',
    keywords: ['team productivity', 'productivity gains', 'automation benefits'],
    priority: 'medium',
  },
  {
    topic: 'Streamlining Operations: An AI-First Approach',
    pillar: 'consulting',
    template: 'thought-leadership',
    keywords: ['streamline operations', 'AI-first', 'operational excellence'],
    priority: 'medium',
  },
  {
    topic: 'How to Identify Automation Opportunities in Your Business',
    pillar: 'consulting',
    template: 'how-to-guide',
    keywords: ['automation opportunities', 'process analysis', 'business automation'],
    priority: 'high',
  },
  {
    topic: 'Reducing Response Times by 2.5x with AI Automation',
    pillar: 'consulting',
    template: 'framework',
    keywords: ['response time', 'customer service efficiency', 'AI speed'],
    priority: 'medium',
  },

  // Consulting Pillar (continued) - Strategic and executive content
  {
    topic: 'Digital Transformation in 2026: What CTOs Need to Know',
    pillar: 'consulting',
    template: 'thought-leadership',
    keywords: ['digital transformation', 'CTO insights', 'enterprise technology'],
    priority: 'high',
  },
  {
    topic: 'Building an AI-First Organization: A Strategic Framework',
    pillar: 'consulting',
    template: 'framework',
    keywords: ['AI strategy', 'organizational change', 'AI adoption'],
    priority: 'high',
  },
  {
    topic: 'AI Adoption Roadmap for Mid-Market Companies',
    pillar: 'consulting',
    template: 'framework',
    keywords: ['AI implementation', 'mid-market AI', 'technology strategy'],
    priority: 'medium',
  },
  {
    topic: 'Managing Change When Implementing AI in Your Organization',
    pillar: 'consulting',
    template: 'thought-leadership',
    keywords: ['change management', 'AI adoption', 'organizational change'],
    priority: 'medium',
  },
  {
    topic: 'Scaling Operations with AI: A Strategic Guide',
    pillar: 'consulting',
    template: 'framework',
    keywords: ['scaling operations', 'AI scale', 'business growth'],
    priority: 'high',
  },
  {
    topic: 'Creating Your Technology Roadmap for AI Integration',
    pillar: 'consulting',
    template: 'framework',
    keywords: ['technology roadmap', 'AI integration', 'digital strategy'],
    priority: 'medium',
  },
  {
    topic: 'Gaining Competitive Advantage Through AI Automation',
    pillar: 'consulting',
    template: 'thought-leadership',
    keywords: ['competitive advantage', 'AI differentiation', 'market leadership'],
    priority: 'high',
  },
  {
    topic: 'Enterprise Modernization: From Legacy to AI-Powered',
    pillar: 'consulting',
    template: 'market-analysis',
    keywords: ['enterprise modernization', 'legacy systems', 'digital upgrade'],
    priority: 'medium',
  },

  // Industry News Pillar - News analysis and predictions
  {
    topic: 'Top AI Trends Shaping Business in 2026',
    pillar: 'industry-news',
    template: 'news-analysis',
    keywords: ['AI trends', 'business AI', 'technology trends'],
    priority: 'high',
  },
  {
    topic: 'The Future of Work: AI and Human Collaboration',
    pillar: 'industry-news',
    template: 'prediction',
    keywords: ['future of work', 'AI workplace', 'human-AI collaboration'],
    priority: 'high',
  },
  {
    topic: 'AI Market Analysis: Where Businesses Are Investing',
    pillar: 'industry-news',
    template: 'market-analysis',
    keywords: ['AI market', 'AI investment', 'enterprise spending'],
    priority: 'medium',
  },
  {
    topic: 'SaaS and AI: The Convergence Reshaping Business Software',
    pillar: 'industry-news',
    template: 'market-analysis',
    keywords: ['SaaS trends', 'AI software', 'business technology'],
    priority: 'medium',
  },
  {
    topic: 'Enterprise Technology Predictions for 2026',
    pillar: 'industry-news',
    template: 'prediction',
    keywords: ['enterprise technology', 'tech predictions', 'business tech'],
    priority: 'high',
  },
  {
    topic: 'How AI Is Changing Business Operations Across Industries',
    pillar: 'industry-news',
    template: 'news-analysis',
    keywords: ['AI business impact', 'industry transformation', 'AI applications'],
    priority: 'medium',
  },
];

/**
 * Get topics for a specific pillar
 */
export function getTopicsByPillar(pillar: string): SEOTopic[] {
  return SEO_TOPIC_BANK.filter((t) => t.pillar === pillar);
}

/**
 * Get high priority topics
 */
export function getHighPriorityTopics(): SEOTopic[] {
  return SEO_TOPIC_BANK.filter((t) => t.priority === 'high');
}

/**
 * Get a topic for today based on day of year (rotates through bank)
 */
export function getTodaysTopic(): SEOTopic {
  const dayOfYear = getDayOfYear();
  const index = dayOfYear % SEO_TOPIC_BANK.length;
  return SEO_TOPIC_BANK[index];
}

/**
 * Get topic by weighted priority (high priority more likely)
 */
export function getWeightedRandomTopic(): SEOTopic {
  const weights = { high: 3, medium: 2, low: 1 };
  const weightedTopics: SEOTopic[] = [];

  for (const topic of SEO_TOPIC_BANK) {
    const weight = weights[topic.priority];
    for (let i = 0; i < weight; i++) {
      weightedTopics.push(topic);
    }
  }

  const index = Math.floor(Math.random() * weightedTopics.length);
  return weightedTopics[index];
}

/**
 * Get topics that haven't been used recently
 * @param usedSlugs - Array of recently used topic slugs
 */
export function getUnusedTopics(usedSlugs: string[]): SEOTopic[] {
  return SEO_TOPIC_BANK.filter(
    (t) => !usedSlugs.includes(t.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  );
}

/**
 * Get day of year (1-365)
 */
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Pillar rotation order for balanced content
 * Emphasizes ai-automation (core business focus)
 */
export const PILLAR_ROTATION = [
  'ai-automation',  // Monday
  'consulting',     // Tuesday
  'ai-automation',  // Wednesday
  'industry-news',  // Thursday
  'consulting',     // Friday
  'ai-automation',  // Saturday
  'consulting',     // Sunday
];

/**
 * Get today's pillar based on day of week
 */
export function getTodaysPillar(): string {
  const dayOfWeek = new Date().getDay(); // 0 = Sunday
  // Adjust so Monday is index 0
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return PILLAR_ROTATION[adjustedDay];
}
