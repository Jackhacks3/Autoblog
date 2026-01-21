# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AUTOBLOG is an automated marketing blog system that uses AI (Claude API) for content generation, Strapi as a headless CMS, and n8n for workflow automation. It's a Turborepo monorepo with three main packages.

## Commands

```bash
# Root (Turborepo)
npm install              # Install all workspaces
npm run dev              # Run all services (web + cms)
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run web:dev          # Frontend only at localhost:3000
npm run cms:dev          # Strapi only at localhost:1337

# Frontend (apps/web)
npm run type-check       # TypeScript check

# Automation (automation/)
npm run generate         # Generate single article via CLI
npm run batch            # Batch generate articles
npm run telegram         # Start Telegram bot for content triggers
npm run test             # Run vitest tests
```

## Architecture

### Three Main Packages

1. **apps/web** - Next.js 14 frontend with App Router
   - Fetches content from Strapi via `lib/cms/client.ts`
   - Transforms Strapi responses to normalized types in `lib/cms/types.ts`
   - Supports both Strapi Cloud and self-hosted schemas (different field names)

2. **cms/** - Strapi 5.x headless CMS
   - Content types: Article, Author, Category, Tag
   - Uses `documentId` for relations (Strapi 5.x pattern)

3. **automation/** - Content generation engine
   - Uses Claude API (`@anthropic-ai/sdk`) for article generation
   - Uses DALL-E 3 for hero image generation
   - Telegram bot integration for content triggers

### Content Generation Pipeline

The pipeline in `automation/src/core/content-engine.ts` runs these stages:
1. **generate-article** - Claude generates structured JSON article
2. **generate-image** - DALL-E creates hero image (optional)
3. **upload-image** - Upload to Strapi media library
4. **publish-to-cms** - Create article in Strapi

### Key Type Mappings

The CMS client (`apps/web/lib/cms/client.ts`) handles schema differences:
- Strapi Cloud: `description`, `cover`, `blocks` (rich-text components)
- Self-hosted: `excerpt`, `featuredImage`, `content` (markdown string)

### Content Pillars

Articles are categorized into pillars defined in `automation/src/config/content-pillars.ts`:
- `ai-automation` - How-to guides, tutorials
- `digital-assets` - Market analysis, explainers
- `consulting` - Thought leadership, frameworks
- `industry-news` - News analysis, predictions

Each pillar maps to a Strapi category slug and has associated templates.

## Environment Variables

Required in `.env`:
```bash
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=              # Strapi API token with full access
ANTHROPIC_API_KEY=sk-ant-...   # For article generation
OPENAI_API_KEY=sk-...          # For DALL-E image generation
```

## Key Files

- `apps/web/lib/cms/client.ts` - Strapi API client with data transformation
- `apps/web/lib/cms/types.ts` - TypeScript types for both Strapi and normalized data
- `automation/src/core/content-engine.ts` - Pipeline orchestration
- `automation/src/generators/article-generator.ts` - Claude prompt construction
- `automation/prompts/blog-generator.md` - System prompt for article generation
- `automation/prompts/templates/*.md` - Per-template writing guidelines
