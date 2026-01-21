#!/usr/bin/env tsx
/**
 * Daily Blog Post Scheduler
 *
 * Generates one SEO-optimized blog post per day for AI/Automation consulting
 *
 * Usage:
 *   npx tsx scripts/daily-scheduler.ts           # Auto-select topic
 *   npx tsx scripts/daily-scheduler.ts --dry-run # Preview without publishing
 *   npx tsx scripts/daily-scheduler.ts --no-image # Skip image generation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { loadConfig, validateConfig } from '../src/config/index.js';
import { runPipeline, checkHealth } from '../src/core/content-engine.js';
import {
  getTodaysTopic,
  getTodaysPillar,
  getTopicsByPillar,
  getWeightedRandomTopic,
  SEOTopic,
} from '../src/config/seo-topics.js';
import type { ArticleRequest, ArticleTemplate } from '../src/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const program = new Command();

program
  .name('daily-scheduler')
  .description('Generate one SEO-optimized blog post per day')
  .option('--dry-run', 'Preview topic selection without generating')
  .option('--no-image', 'Skip hero image generation')
  .option('--pillar <pillar>', 'Override pillar selection')
  .option('--random', 'Use weighted random topic instead of rotation')
  .option('--status <status>', 'Publish status (draft or published)', 'draft')
  .parse();

const options = program.opts();

// Log file for tracking generated articles
const LOG_FILE = resolve(__dirname, '../logs/generation-history.json');

interface GenerationLog {
  date: string;
  topic: string;
  pillar: string;
  template: string;
  slug: string;
  success: boolean;
  error?: string;
  duration?: number;
}

/**
 * Load generation history
 */
async function loadHistory(): Promise<GenerationLog[]> {
  try {
    const logDir = dirname(LOG_FILE);
    if (!existsSync(logDir)) {
      await mkdir(logDir, { recursive: true });
    }
    if (!existsSync(LOG_FILE)) {
      return [];
    }
    const data = await readFile(LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save generation history
 */
async function saveHistory(history: GenerationLog[]): Promise<void> {
  const logDir = dirname(LOG_FILE);
  if (!existsSync(logDir)) {
    await mkdir(logDir, { recursive: true });
  }
  await writeFile(LOG_FILE, JSON.stringify(history, null, 2));
}

/**
 * Check if we already generated today
 */
function hasGeneratedToday(history: GenerationLog[]): boolean {
  const today = new Date().toISOString().split('T')[0];
  return history.some((log) => log.date === today && log.success);
}

/**
 * Get recently used topic slugs (last 30 days)
 */
function getRecentSlugs(history: GenerationLog[]): string[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return history
    .filter((log) => new Date(log.date) >= thirtyDaysAgo && log.success)
    .map((log) => log.slug);
}

/**
 * Select topic for today
 */
function selectTopic(history: GenerationLog[]): SEOTopic {
  const recentSlugs = getRecentSlugs(history);

  if (options.random) {
    // Weighted random selection
    let topic = getWeightedRandomTopic();
    let attempts = 0;

    // Try to avoid recent topics
    while (recentSlugs.includes(topic.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')) && attempts < 10) {
      topic = getWeightedRandomTopic();
      attempts++;
    }

    return topic;
  }

  // Use pillar rotation with smart topic selection
  const pillar = options.pillar || getTodaysPillar();
  const pillarTopics = getTopicsByPillar(pillar);

  // Find unused topic from pillar
  for (const topic of pillarTopics) {
    const slug = topic.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!recentSlugs.includes(slug)) {
      return topic;
    }
  }

  // Fallback to rotation if all pillar topics used recently
  return getTodaysTopic();
}

/**
 * Format duration in human readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

async function main() {
  const startTime = Date.now();

  console.log(chalk.bold('\n📝 AUTOBLOG Daily Scheduler\n'));
  console.log(chalk.gray(`Date: ${new Date().toLocaleDateString()}`));
  console.log(chalk.gray(`Time: ${new Date().toLocaleTimeString()}\n`));

  // Load history
  const history = await loadHistory();

  // Check if already generated today
  if (hasGeneratedToday(history) && !options.dryRun) {
    console.log(chalk.yellow('⚠️  Already generated a post today. Skipping.'));
    console.log(chalk.gray('   Use --dry-run to preview topic selection.\n'));
    process.exit(0);
  }

  // Select topic
  const selectedTopic = selectTopic(history);

  console.log(chalk.bold('Selected Topic:'));
  console.log(chalk.cyan(`  Topic:    ${selectedTopic.topic}`));
  console.log(chalk.cyan(`  Pillar:   ${selectedTopic.pillar}`));
  console.log(chalk.cyan(`  Template: ${selectedTopic.template}`));
  console.log(chalk.cyan(`  Keywords: ${selectedTopic.keywords.join(', ')}`));
  console.log(chalk.cyan(`  Priority: ${selectedTopic.priority}\n`));

  if (options.dryRun) {
    console.log(chalk.yellow('🔍 Dry run mode - no content generated.\n'));

    // Show what would be generated
    console.log(chalk.bold('Upcoming rotation (next 7 days):'));
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();
    for (let i = 0; i < 7; i++) {
      const dayIndex = (today + i) % 7;
      const adjustedDay = dayIndex === 0 ? 6 : dayIndex - 1;
      const pillarRotation = ['ai-automation', 'consulting', 'ai-automation', 'industry-news', 'consulting', 'ai-automation', 'digital-assets'];
      const pillar = pillarRotation[adjustedDay];
      const marker = i === 0 ? ' ← Today' : '';
      console.log(chalk.gray(`  ${days[adjustedDay]}: ${pillar}${marker}`));
    }
    console.log();
    process.exit(0);
  }

  // Validate configuration
  const spinner = ora('Checking configuration...').start();

  try {
    const config = loadConfig();
    validateConfig(config);
    spinner.succeed('Configuration valid');
  } catch (error) {
    spinner.fail('Configuration error');
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }

  // Check CMS health
  spinner.start('Checking Strapi CMS connection...');
  try {
    const health = await checkHealth();
    if (!health.strapi) {
      throw new Error('Strapi CMS is not responding');
    }
    spinner.succeed('Strapi CMS connected');
  } catch (error) {
    spinner.fail('CMS connection failed');
    console.error(chalk.red((error as Error).message));
    console.log(chalk.yellow('\nMake sure Strapi is running: npm run cms:dev\n'));
    process.exit(1);
  }

  // Build article request
  const request: ArticleRequest = {
    topic: selectedTopic.topic,
    pillar: selectedTopic.pillar,
    template: selectedTopic.template as ArticleTemplate,
    keywords: selectedTopic.keywords,
    targetLength: 'medium',
  };

  // Run the pipeline
  spinner.start('Generating article with Claude AI...');

  const pipelineStart = Date.now();
  const result = await runPipeline(request, {
    generateImage: options.image !== false,
    publishStatus: options.status as 'draft' | 'published',
  });

  const pipelineDuration = Date.now() - pipelineStart;

  if (result.success) {
    spinner.succeed('Article generated and published!');

    // Log the generation
    const log: GenerationLog = {
      date: new Date().toISOString().split('T')[0],
      topic: selectedTopic.topic,
      pillar: selectedTopic.pillar,
      template: selectedTopic.template,
      slug: result.article?.slug || 'unknown',
      success: true,
      duration: pipelineDuration,
    };
    history.push(log);
    await saveHistory(history);

    // Display results
    console.log('\n' + chalk.bold.green('✅ Article Published Successfully!\n'));

    if (result.article) {
      console.log(chalk.bold('Article Details:'));
      console.log(chalk.cyan(`  Title:    ${result.article.title}`));
      console.log(chalk.cyan(`  Slug:     ${result.article.slug}`));
      console.log(chalk.cyan(`  ID:       ${result.article.documentId}`));
      console.log(chalk.cyan(`  Status:   ${options.status}`));
    }

    console.log('\n' + chalk.bold('Pipeline Stages:'));
    for (const stage of result.stages) {
      const icon = stage.status === 'completed' ? '✓' : stage.status === 'skipped' ? '○' : '✗';
      const color = stage.status === 'completed' ? chalk.green : stage.status === 'skipped' ? chalk.gray : chalk.red;
      console.log(color(`  ${icon} ${stage.name} (${formatDuration(stage.duration)})`));
    }

    console.log('\n' + chalk.gray(`Total time: ${formatDuration(Date.now() - startTime)}`));

  } else {
    spinner.fail('Article generation failed');

    // Log the failure
    const log: GenerationLog = {
      date: new Date().toISOString().split('T')[0],
      topic: selectedTopic.topic,
      pillar: selectedTopic.pillar,
      template: selectedTopic.template,
      slug: 'failed',
      success: false,
      error: result.errors[0]?.message || 'Unknown error',
      duration: pipelineDuration,
    };
    history.push(log);
    await saveHistory(history);

    console.log('\n' + chalk.bold.red('❌ Generation Failed\n'));

    console.log(chalk.bold('Pipeline Stages:'));
    for (const stage of result.stages) {
      const icon = stage.status === 'completed' ? '✓' : stage.status === 'skipped' ? '○' : '✗';
      const color = stage.status === 'completed' ? chalk.green : stage.status === 'skipped' ? chalk.gray : chalk.red;
      console.log(color(`  ${icon} ${stage.name}`));
    }

    if (result.errors.length > 0) {
      console.log('\n' + chalk.bold('Errors:'));
      for (const error of result.errors) {
        console.log(chalk.red(`  - ${error.message}`));
      }
    }

    process.exit(1);
  }

  console.log('\n');
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error.message);
  process.exit(1);
});
