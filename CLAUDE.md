# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AUTOBLOG is an automated marketing blog system for a Digital Assets Development Platform & AI Consulting company. The system uses AI (Claude API) for content generation, a headless CMS (Strapi) for content management, and n8n for workflow automation.

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **CMS**: Strapi (self-hosted, Node.js)
- **Automation**: n8n (self-hosted)
- **AI Content**: Anthropic Claude API
- **Image Generation**: DALL-E 3 / OpenAI
- **Database**: PostgreSQL
- **Hosting**: Vercel (frontend), Railway/Render (CMS)
- **Analytics**: Plausible + GA4

## Project Structure

```
AUTOBLOG/
├── apps/web/              # Next.js frontend
├── cms/                   # Strapi CMS
├── automation/            # n8n workflows and AI prompts
├── content/               # Templates and style guides
├── infrastructure/        # Docker and deployment config
├── .github/workflows/     # CI/CD pipelines
└── docs/                  # Documentation
```

## Commands

### Monorepo (Root)
```bash
npm install              # Install all dependencies
npm run dev              # Run all services in dev mode
npm run build            # Build all packages
npm run lint             # Lint all packages
```

### Frontend (apps/web)
```bash
cd apps/web
npm run dev              # Start dev server at localhost:3000
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

### CMS (cms)
```bash
cd cms
npm run develop          # Start Strapi at localhost:1337
npm run build            # Build admin panel
npm run start            # Start production server
npm run strapi generate  # Generate new API/content-type
```

### Docker (Local Development)
```bash
cd infrastructure/docker
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f cms     # View CMS logs
```

## Architecture

### Content Generation Pipeline
1. **Trigger** - Schedule, manual, or calendar update
2. **Research** - Keyword trends, competitor analysis via n8n
3. **Generation** - Claude API generates structured content
4. **SEO Optimization** - Meta tags, schema markup, internal links
5. **Image Generation** - DALL-E 3 hero images with alt text
6. **Review** - Quality check, fact verification
7. **Publishing** - Push to CMS, trigger site rebuild
8. **Distribution** - Social media, newsletter, IndexNow ping

### Content Model (Strapi)
- **Article**: title, slug, excerpt, content, featuredImage, author, category, tags, seo, status
- **Author**: name, slug, avatar, bio, role, expertise, socialLinks
- **Category**: name, slug, description, color, parentCategory, seo
- **Tag**: name, slug, description

### Automation Workflows (n8n)
- `content-generation.json` - AI article generation pipeline
- `seo-optimization.json` - Automated SEO enhancements
- `image-generation.json` - DALL-E hero image creation
- `social-distribution.json` - Multi-platform posting
- `analytics-reporting.json` - Weekly/monthly reports

## Environment Variables

Required in `.env`:
```bash
# CMS
STRAPI_URL=https://cms.yourdomain.com
STRAPI_API_TOKEN=

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://...

# Automation
N8N_WEBHOOK_URL=
N8N_API_KEY=

# Analytics
GA_MEASUREMENT_ID=G-...
PLAUSIBLE_DOMAIN=

# Deployment
VERCEL_TOKEN=
```

## Content Pillars

1. **AI & Automation** - LLM applications, automation workflows (how-to guides, tutorials)
2. **Digital Assets** - Tokenization, blockchain, NFT utility (market analysis, explainers)
3. **Consulting Insights** - Strategy, transformation, ROI (thought leadership, frameworks)
4. **Industry News** - AI/tech developments (news analysis, predictions)

## SEO Requirements

- Unique title tags (50-60 chars)
- Meta descriptions (150-160 chars)
- One H1 per page with logical H2/H3 hierarchy
- Schema.org markup (Article, Organization, Author)
- Core Web Vitals: LCP < 2.5s, CLS < 0.1
- Alt text on all images
- Internal linking strategy

## Key Files

- `apps/web/lib/cms/client.ts` - Strapi API client
- `apps/web/components/seo/JsonLd.tsx` - Schema markup
- `automation/prompts/blog-generator.md` - Master AI prompt
- `content/style-guide.md` - Brand voice and writing standards
