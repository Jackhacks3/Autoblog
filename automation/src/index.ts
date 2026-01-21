/**
 * AUTOBLOG Content Automation Engine
 *
 * CLI entry point for content generation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig, validateConfig } from './config/index.js';
import { getPillarSlugs, getPillar } from './config/content-pillars.js';
import { runPipeline, checkHealth } from './core/content-engine.js';
import { generateArticle } from './generators/article-generator.js';
import type { ArticleRequest, ArticleTemplate } from './types/index.js';

const program = new Command();

program
  .name('autoblog')
  .description('AUTOBLOG Content Automation Engine')
  .version('1.0.0');

/**
 * Generate a single article
 */
program
  .command('generate')
  .description('Generate a new article')
  .requiredOption('-t, --topic <topic>', 'Article topic')
  .requiredOption('-p, --pillar <pillar>', `Content pillar (${getPillarSlugs().join(', ')})`)
  .option('--template <template>', 'Article template (how-to-guide, news-analysis, etc.)')
  .option('--length <length>', 'Target length (short, medium, long)', 'medium')
  .option('--no-image', 'Skip image generation')
  .option('--no-publish', 'Skip publishing to CMS')
  .option('--status <status>', 'Publication status (draft, published)', 'draft')
  .option('--dry-run', 'Generate content without publishing')
  .action(async (options) => {
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

      if (options.dryRun || options.publish === false) {
        // Generate content only
        spinner.start('Generating article content...');
        const article = await generateArticle(request);
        spinner.succeed('Article generated');

        console.log('\n' + chalk.bold('Generated Article:'));
        console.log(chalk.cyan('Title:'), article.title);
        console.log(chalk.cyan('Slug:'), article.slug);
        console.log(chalk.cyan('Description:'), article.description);
        console.log(chalk.cyan('Reading Time:'), `${article.readingTime} min`);
        console.log(chalk.cyan('Tags:'), article.tags.join(', '));
        console.log('\n' + chalk.bold('Content Preview:'));
        console.log(article.content.slice(0, 500) + '...');
      } else {
        // Run full pipeline
        spinner.start('Running content pipeline...');
        const result = await runPipeline(request, {
          generateImage: options.image !== false,
          publishStatus: options.status as 'draft' | 'published',
        });

        if (result.success) {
          spinner.succeed('Content pipeline completed');
          console.log('\n' + chalk.green('Article created successfully!'));

          if (result.article) {
            console.log(chalk.cyan('Document ID:'), result.article.documentId);
            console.log(chalk.cyan('Title:'), result.article.title);
            console.log(chalk.cyan('Slug:'), result.article.slug);
          }

          console.log('\n' + chalk.bold('Pipeline Stages:'));
          for (const stage of result.stages) {
            const icon = stage.status === 'completed' ? '✓' : stage.status === 'skipped' ? '○' : '✗';
            const color = stage.status === 'completed' ? chalk.green : stage.status === 'skipped' ? chalk.gray : chalk.red;
            console.log(color(`  ${icon} ${stage.name} (${stage.duration}ms)`));
          }
        } else {
          spinner.fail('Content pipeline failed');
          console.log('\n' + chalk.red('Errors:'));
          for (const error of result.errors) {
            console.log(chalk.red(`  - ${error.message}`));
          }
          process.exit(1);
        }
      }
    } catch (error) {
      spinner.fail('Error');
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

/**
 * Health check command
 */
program
  .command('health')
  .description('Check system health')
  .action(async () => {
    const spinner = ora('Checking system health...').start();

    try {
      const config = loadConfig();
      validateConfig(config);
      spinner.succeed('Configuration valid');

      spinner.start('Checking Strapi connection...');
      const health = await checkHealth();

      if (health.strapi) {
        spinner.succeed('Strapi connection OK');
      } else {
        spinner.fail('Strapi connection failed');
      }

      console.log('\n' + chalk.bold('System Status:'));
      console.log(chalk.cyan('  Strapi CMS:'), health.strapi ? chalk.green('Connected') : chalk.red('Disconnected'));
      console.log(chalk.cyan('  Engine Ready:'), health.ready ? chalk.green('Yes') : chalk.red('No'));
    } catch (error) {
      spinner.fail('Health check failed');
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

/**
 * List available pillars and templates
 */
program
  .command('list')
  .description('List available content pillars and templates')
  .action(() => {
    console.log(chalk.bold('\nContent Pillars:\n'));

    for (const slug of getPillarSlugs()) {
      const pillar = getPillar(slug)!;
      console.log(chalk.cyan(`  ${slug}`));
      console.log(chalk.gray(`    Name: ${pillar.name}`));
      console.log(chalk.gray(`    Templates: ${pillar.templates.join(', ')}`));
      console.log(chalk.gray(`    Tone: ${pillar.tone}`));
      console.log();
    }
  });

program.parse();
