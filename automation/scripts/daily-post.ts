#!/usr/bin/env tsx
/**
 * Daily Post Scheduler
 *
 * Automatically generates and publishes one blog post per day.
 * Designed to be run via Windows Task Scheduler or cron.
 *
 * Usage:
 *   npx tsx scripts/daily-post.ts
 *   npx tsx scripts/daily-post.ts --dry-run    # Generate without publishing
 *   npx tsx scripts/daily-post.ts --no-image   # Skip image generation
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, validateConfig } from '../src/config/index.js';
import { runPipeline } from '../src/core/content-engine.js';
import type { ArticleRequest, ArticleTemplate } from '../src/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface TopicConfig {
  'ai-automation': string[];
  consulting: string[];
  [key: string]: string[];
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const noImage = args.includes('--no-image');

async function loadTopics(): Promise<TopicConfig> {
  const topicsPath = resolve(__dirname, '../config/daily-topics.json');
  const content = await readFile(topicsPath, 'utf-8');
  return JSON.parse(content);
}

async function getUsedTopics(): Promise<Set<string>> {
  const historyPath = resolve(__dirname, '../config/topic-history.json');
  try {
    const content = await readFile(historyPath, 'utf-8');
    const history = JSON.parse(content);
    return new Set(history.used || []);
  } catch {
    return new Set();
  }
}

async function saveUsedTopic(topic: string): Promise<void> {
  const historyPath = resolve(__dirname, '../config/topic-history.json');
  const used = await getUsedTopics();
  used.add(topic);

  // Keep only last 100 topics to allow recycling
  const usedArray = Array.from(used).slice(-100);

  await mkdir(dirname(historyPath), { recursive: true });
  await writeFile(historyPath, JSON.stringify({ used: usedArray, lastUpdated: new Date().toISOString() }, null, 2));
}

function selectTopic(topics: string[], used: Set<string>): string | null {
  const available = topics.filter((t) => !used.has(t));

  if (available.length === 0) {
    // All topics used, pick random from all
    return topics[Math.floor(Math.random() * topics.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}

function selectPillarAndTemplate(): { pillar: string; template: ArticleTemplate } {
  // Weighted selection based on content priorities
  const pillars = [
    { pillar: 'ai-automation', templates: ['how-to-guide', 'tutorial', 'explainer'] as ArticleTemplate[], weight: 6 },
    { pillar: 'consulting', templates: ['thought-leadership', 'framework', 'how-to-guide'] as ArticleTemplate[], weight: 3 },
    { pillar: 'industry-news', templates: ['news-analysis', 'market-analysis'] as ArticleTemplate[], weight: 1 },
  ];

  const totalWeight = pillars.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.floor(Math.random() * totalWeight);

  for (const p of pillars) {
    random -= p.weight;
    if (random < 0) {
      const template = p.templates[Math.floor(Math.random() * p.templates.length)];
      return { pillar: p.pillar, template };
    }
  }

  return { pillar: 'ai-automation', template: 'how-to-guide' };
}

async function main() {
  console.log(chalk.bold.blue('\n🚀 AUTOBLOG Daily Post Generator\n'));
  console.log(chalk.gray(`Date: ${new Date().toLocaleDateString()}`));
  console.log(chalk.gray(`Mode: ${dryRun ? 'Dry Run (no publishing)' : 'Live'}`));
  console.log(chalk.gray(`Images: ${noImage ? 'Disabled' : 'Enabled'}\n`));

  const spinner = ora('Loading configuration...').start();

  try {
    // Load and validate config
    const config = loadConfig();
    validateConfig(config);
    spinner.succeed('Configuration loaded');

    // Load topics
    spinner.start('Loading topic database...');
    const topics = await loadTopics();
    const usedTopics = await getUsedTopics();
    spinner.succeed(`Loaded ${Object.values(topics).flat().length} topics (${usedTopics.size} previously used)`);

    // Select pillar and template
    const { pillar, template } = selectPillarAndTemplate();
    console.log(chalk.cyan(`\nSelected pillar: ${pillar}`));
    console.log(chalk.cyan(`Selected template: ${template}`));

    // Select topic
    const pillarTopics = topics[pillar] || topics['ai-automation'];
    const topic = selectTopic(pillarTopics, usedTopics);

    if (!topic) {
      spinner.fail('No topics available');
      process.exit(1);
    }

    console.log(chalk.green(`\n📝 Today's topic: "${topic}"\n`));

    // Build request
    const request: ArticleRequest = {
      topic,
      pillar,
      template,
      targetLength: 'medium',
    };

    if (dryRun) {
      console.log(chalk.yellow('\n⚠️  Dry run mode - skipping article generation and publishing'));
      console.log(chalk.gray('\nWould generate article with:'));
      console.log(JSON.stringify(request, null, 2));
      return;
    }

    // Run the full pipeline
    spinner.start('Generating article with Claude AI...');
    const result = await runPipeline(request, {
      generateImage: !noImage,
      skipCms: false,
    });

    if (!result.success) {
      spinner.fail('Pipeline failed');
      console.error(chalk.red('\nErrors:'));
      result.errors.forEach((err) => console.error(chalk.red(`  - ${err.message}`)));
      process.exit(1);
    }

    spinner.succeed('Article generated and published!');

    // Save topic to history
    await saveUsedTopic(topic);

    // Display summary
    console.log(chalk.bold.green('\n✅ Daily post completed successfully!\n'));
    console.log(chalk.bold('Pipeline Summary:'));
    result.stages.forEach((stage) => {
      const icon = stage.status === 'completed' ? '✓' : stage.status === 'skipped' ? '○' : '✗';
      const color = stage.status === 'completed' ? chalk.green : stage.status === 'skipped' ? chalk.gray : chalk.red;
      console.log(color(`  ${icon} ${stage.name}: ${stage.duration}ms`));
    });

    if (result.article) {
      console.log(chalk.bold('\nPublished Article:'));
      console.log(chalk.cyan(`  Title: ${result.article.title}`));
      console.log(chalk.cyan(`  Slug: ${result.article.slug}`));
      console.log(chalk.cyan(`  ID: ${result.article.documentId}`));
    }

    // Log to file for tracking
    const logPath = resolve(__dirname, '../logs/daily-posts.log');
    await mkdir(dirname(logPath), { recursive: true });
    const logEntry = `${new Date().toISOString()} | ${topic} | ${result.article?.slug || 'N/A'} | SUCCESS\n`;
    await writeFile(logPath, logEntry, { flag: 'a' });

  } catch (error) {
    spinner.fail('Error');
    console.error(chalk.red((error as Error).message));
    if (process.env.DEBUG) {
      console.error(error);
    }

    // Log error
    const logPath = resolve(__dirname, '../logs/daily-posts.log');
    await mkdir(dirname(logPath), { recursive: true });
    const logEntry = `${new Date().toISOString()} | ERROR | ${(error as Error).message}\n`;
    await writeFile(logPath, logEntry, { flag: 'a' });

    process.exit(1);
  }
}

main();
