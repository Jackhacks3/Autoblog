#!/usr/bin/env tsx
/**
 * Generate Article Script
 *
 * Standalone script for generating a single article
 *
 * Usage:
 *   npx tsx scripts/generate-article.ts --topic "Your Topic" --pillar ai-automation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { loadConfig, validateConfig } from '../src/config/index.js';
import { getPillarSlugs, getPillar } from '../src/config/content-pillars.js';
import { generateArticle } from '../src/generators/article-generator.js';
import type { ArticleRequest, ArticleTemplate } from '../src/types/index.js';

const program = new Command();

program
  .name('generate-article')
  .description('Generate a single article using Claude AI')
  .requiredOption('-t, --topic <topic>', 'Article topic')
  .requiredOption('-p, --pillar <pillar>', `Content pillar (${getPillarSlugs().join(', ')})`)
  .option('--template <template>', 'Article template')
  .option('--length <length>', 'Target length (short, medium, long)', 'medium')
  .option('-o, --output <path>', 'Output file path (JSON)')
  .option('--markdown', 'Also save content as markdown file')
  .parse();

const options = program.opts();

async function main() {
  const spinner = ora('Initializing...').start();

  try {
    // Validate config
    const config = loadConfig();
    validateConfig(config);
    spinner.succeed('Configuration loaded');

    // Validate pillar
    const pillar = getPillar(options.pillar);
    if (!pillar) {
      spinner.fail(`Invalid pillar: ${options.pillar}`);
      console.log(chalk.yellow(`Available pillars: ${getPillarSlugs().join(', ')}`));
      process.exit(1);
    }

    // Build request
    const request: ArticleRequest = {
      topic: options.topic,
      pillar: options.pillar,
      template: options.template as ArticleTemplate | undefined,
      targetLength: options.length as 'short' | 'medium' | 'long',
    };

    // Generate article
    spinner.start(`Generating article: "${options.topic}"...`);
    const article = await generateArticle(request);
    spinner.succeed('Article generated successfully!');

    // Display summary
    console.log('\n' + chalk.bold('Article Summary:'));
    console.log(chalk.cyan('  Title:'), article.title);
    console.log(chalk.cyan('  Slug:'), article.slug);
    console.log(chalk.cyan('  Description:'), article.description);
    console.log(chalk.cyan('  Pillar:'), article.pillar);
    console.log(chalk.cyan('  Template:'), article.template);
    console.log(chalk.cyan('  Reading Time:'), `${article.readingTime} min`);
    console.log(chalk.cyan('  Tags:'), article.tags.join(', '));
    console.log(chalk.cyan('  Word Count:'), article.content.split(/\s+/).length);

    // Save to file if requested
    if (options.output) {
      const outputPath = resolve(process.cwd(), options.output);
      await writeFile(outputPath, JSON.stringify(article, null, 2));
      console.log(chalk.green(`\nSaved to: ${outputPath}`));
    }

    // Save markdown if requested
    if (options.markdown) {
      const mdPath = options.output
        ? options.output.replace('.json', '.md')
        : `${article.slug}.md`;
      const mdContent = `# ${article.title}\n\n${article.content}`;
      await writeFile(resolve(process.cwd(), mdPath), mdContent);
      console.log(chalk.green(`Markdown saved to: ${mdPath}`));
    }

    // Preview content
    console.log('\n' + chalk.bold('Content Preview:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(article.content.slice(0, 800));
    if (article.content.length > 800) {
      console.log(chalk.gray('\n... (truncated)'));
    }
    console.log(chalk.gray('─'.repeat(60)));

  } catch (error) {
    spinner.fail('Error generating article');
    console.error(chalk.red((error as Error).message));
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
