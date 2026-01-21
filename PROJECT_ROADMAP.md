# AUTOBLOG Project Construction Roadmap

## Document Purpose
This roadmap defines the systematic construction of the AUTOBLOG automated marketing blog system. Each phase must be completed and validated before proceeding to the next.

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| Project Name | AUTOBLOG |
| Type | Automated Marketing Blog System |
| Architecture | Monorepo (Turborepo) |
| Primary Stack | Next.js 14 + Strapi CMS + n8n |
| Target Deployment | Vercel (Frontend) + Railway (CMS) |

---

## Phase 0: Foundation Setup
**Status:** COMPLETE ✓
**Dependencies:** None
**Estimated Effort:** 1 session

### Tasks
- [x] Create CLAUDE.md with project specifications
- [x] Create root package.json (monorepo config)
- [x] Create turbo.json (build orchestration)
- [x] Create .env.example (environment template)
- [x] Create .gitignore

### Validation Checklist
- [x] `npm install` runs without errors at root
- [x] Directory structure matches specification
- [x] Environment variables documented

### Files Created
```
AUTOBLOG/
├── CLAUDE.md
├── PROJECT_ROADMAP.md (this file)
├── package.json
├── turbo.json
├── .env.example
└── .gitignore
```

### Next Step
Proceed to **Phase 1: Next.js Frontend Foundation**

---

## Phase 1: Next.js Frontend Foundation
**Status:** COMPLETE ✓
**Dependencies:** Phase 0 complete
**Estimated Effort:** 1-2 sessions

### Tasks
- [x] Initialize Next.js 14 with App Router in `apps/web/`
- [x] Configure TypeScript with strict mode
- [x] Set up Tailwind CSS with custom theme
- [x] Create base layout structure
- [x] Add essential SEO components (MetaTags, JsonLd)
- [x] Create CMS client library stub

### Files to Create
```
apps/web/
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage
│   ├── globals.css         # Global styles
│   └── blog/
│       ├── page.tsx        # Blog listing
│       └── [slug]/
│           └── page.tsx    # Individual article
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── blog/               # Blog-specific components
│   └── seo/                # SEO components
├── lib/
│   ├── cms/
│   │   ├── client.ts       # Strapi API client
│   │   └── queries.ts      # GraphQL/REST queries
│   └── utils/
│       └── index.ts
└── public/
    ├── robots.txt
    └── images/
```

### Validation Checklist
- [x] `npm run dev` starts server at localhost:3000
- [x] `npm run build` completes without errors
- [x] `npm run type-check` passes
- [ ] Homepage renders correctly
- [ ] Blog routes are accessible (with placeholder content)
- [ ] SEO meta tags render in HTML head

### Integration Points
| System | Integration Type | Status |
|--------|-----------------|--------|
| Strapi CMS | REST/GraphQL API calls | Stub ready |
| Analytics | Script injection | Not started |
| Vercel | Deployment config | Not started |

### Next Step
Proceed to **Phase 2: Strapi CMS Setup**

---

## Phase 2: Strapi CMS Setup
**Status:** COMPLETE ✓
**Dependencies:** Phase 1 complete
**Estimated Effort:** 1-2 sessions

### Tasks
- [x] Initialize Strapi 5.x project in `cms/`
- [x] Configure PostgreSQL/SQLite database connection
- [x] Create Article content type
- [x] Create Author content type
- [x] Create Category content type
- [x] Create Tag content type
- [x] Create SEO component (reusable)
- [x] Set up API routes
- [ ] Generate API tokens (via admin panel after first run)

### Content Type Schemas
```
Article:
  - title (string, required, max 70)
  - slug (uid, from title)
  - excerpt (text, required, max 160)
  - content (rich text)
  - featuredImage (media)
  - author (relation -> Author)
  - category (relation -> Category)
  - tags (relation -> Tag, many)
  - publishedAt (datetime)
  - status (enum: draft, in_review, scheduled, published)
  - seo (component)
  - readingTime (number)
  - lastUpdated (datetime)
  - aiGenerated (boolean)

Author:
  - name (string)
  - slug (uid)
  - avatar (media)
  - bio (text)
  - role (string)
  - expertise (json)
  - socialLinks (json)

Category:
  - name (string)
  - slug (uid)
  - description (text)
  - color (string)
  - parentCategory (relation -> Category)
  - seo (component)

Tag:
  - name (string)
  - slug (uid)
  - description (text)
```

### Files to Create
```
cms/
├── package.json
├── config/
│   ├── database.js
│   ├── server.js
│   ├── admin.js
│   └── plugins.js
├── src/
│   ├── api/
│   │   ├── article/
│   │   ├── author/
│   │   ├── category/
│   │   └── tag/
│   └── components/
│       └── shared/
│           └── seo.json
└── database/
    └── migrations/
```

### Validation Checklist
- [ ] `npm run develop` starts Strapi at localhost:1337
- [ ] Admin panel accessible and functional
- [ ] All content types visible in admin
- [ ] Can create/edit/delete articles via admin
- [ ] API endpoints return correct data
- [ ] API token authentication works

### Integration Points
| System | Integration Type | Status |
|--------|-----------------|--------|
| Next.js Frontend | API consumption | Ready to connect |
| PostgreSQL | Database | Configured |
| n8n Automation | Webhook triggers | Not started |

### Next Step
Proceed to **Phase 3: Frontend-CMS Integration**

---

## Phase 3: Frontend-CMS Integration
**Status:** NOT STARTED
**Dependencies:** Phase 1 + Phase 2 complete
**Estimated Effort:** 1 session

### Tasks
- [ ] Implement Strapi client with proper typing
- [ ] Create data fetching functions for articles
- [ ] Build article listing page with real data
- [ ] Build individual article page with real data
- [ ] Implement ISR (Incremental Static Regeneration)
- [ ] Add loading and error states
- [ ] Test with sample content in CMS

### Files to Modify/Create
```
apps/web/lib/cms/
├── client.ts           # Full implementation
├── queries.ts          # All query functions
└── types.ts            # TypeScript interfaces

apps/web/app/blog/
├── page.tsx            # Connected to CMS
└── [slug]/page.tsx     # Connected to CMS
```

### Validation Checklist
- [ ] Article list fetches from Strapi
- [ ] Individual articles render correctly
- [ ] Images load from Strapi media
- [ ] Author info displays
- [ ] Categories/tags link correctly
- [ ] 404 handles missing articles
- [ ] ISR revalidation works

### Integration Test Scenarios
| Scenario | Expected Result |
|----------|-----------------|
| Create article in Strapi | Appears on frontend after revalidation |
| Update article | Changes reflect on frontend |
| Delete article | Returns 404 |
| Draft article | Not visible on frontend |

### Next Step
Proceed to **Phase 4: SEO Implementation**

---

## Phase 4: SEO Implementation
**Status:** NOT STARTED
**Dependencies:** Phase 3 complete
**Estimated Effort:** 1 session

### Tasks
- [ ] Implement dynamic meta tags from CMS data
- [ ] Add Article schema.org markup
- [ ] Add Organization schema markup
- [ ] Add Author schema markup
- [ ] Create XML sitemap generation
- [ ] Configure robots.txt
- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags
- [ ] Implement canonical URLs

### Files to Create/Modify
```
apps/web/
├── app/
│   ├── sitemap.ts          # Dynamic sitemap
│   └── robots.ts           # Robots.txt
├── components/seo/
│   ├── JsonLd.tsx          # Schema markup
│   ├── MetaTags.tsx        # Meta generation
│   └── OpenGraph.tsx       # OG tags
└── lib/seo/
    └── metadata.ts         # Metadata utilities
```

### Validation Checklist
- [ ] View source shows correct meta tags
- [ ] Google Rich Results Test passes
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Robots.txt accessible at /robots.txt
- [ ] Social share preview works (Facebook debugger)
- [ ] Twitter Card validator passes

### Next Step
Proceed to **Phase 5: Automation Foundation (n8n)**

---

## Phase 5: Automation Foundation (n8n)
**Status:** COMPLETE ✓
**Dependencies:** Phase 4 complete
**Estimated Effort:** 2 sessions

### Tasks
- [x] Create n8n workflow directory structure
- [x] Design content generation workflow
- [x] Create AI prompt templates
- [x] Build CMS integration workflow
- [x] Create image generation workflow
- [x] Set up webhook endpoints
- [x] Document workflow triggers

### Files Created
```
automation/
├── package.json                    # Node.js dependencies
├── tsconfig.json                   # TypeScript configuration
├── src/
│   ├── index.ts                    # CLI entry point
│   ├── config/
│   │   ├── index.ts                # Environment config loader
│   │   └── content-pillars.ts      # Content pillar definitions
│   ├── clients/
│   │   ├── anthropic.ts            # Claude API wrapper
│   │   ├── openai.ts               # DALL-E 3 wrapper
│   │   ├── strapi.ts               # Strapi write client
│   │   └── strapi-media.ts         # Media upload handler
│   ├── generators/
│   │   ├── article-generator.ts    # Claude content generation
│   │   └── image-generator.ts      # DALL-E hero images
│   ├── core/
│   │   └── content-engine.ts       # Pipeline orchestration
│   └── types/
│       └── index.ts                # TypeScript definitions
├── prompts/
│   ├── blog-generator.md           # Master content prompt
│   ├── image-prompt.md             # DALL-E image prompt
│   └── templates/
│       ├── how-to-guide.md
│       ├── news-analysis.md
│       ├── thought-leadership.md
│       └── market-analysis.md
├── n8n-workflows/
│   ├── content-generation.json     # Main content pipeline
│   └── README.md                   # Import instructions
└── scripts/
    └── generate-article.ts         # Standalone article generation
```

### Validation Checklist
- [x] TypeScript compiles without errors
- [x] Workflows export as JSON
- [x] Claude API client implemented
- [x] OpenAI API client implemented
- [x] Strapi write client implemented
- [ ] Test content generation end-to-end (requires valid API key)

### Integration Points
| System | Integration Type | Status |
|--------|-----------------|--------|
| Claude API | Content generation | Workflow ready |
| OpenAI API | Image generation | Workflow ready |
| Strapi CMS | Content publishing | Webhook configured |

### Next Step
Proceed to **Phase 6: Infrastructure & Docker**

---

## Phase 6: Infrastructure & Docker
**Status:** NOT STARTED
**Dependencies:** Phase 5 complete
**Estimated Effort:** 1 session

### Tasks
- [ ] Create Docker Compose for local dev
- [ ] Configure PostgreSQL container
- [ ] Configure n8n container
- [ ] Configure Redis container (optional caching)
- [ ] Create CMS Dockerfile
- [ ] Document local setup process

### Files to Create
```
infrastructure/
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── Dockerfile.cms
│   └── .env.docker
└── scripts/
    ├── setup-local.sh
    └── seed-data.sh
```

### Validation Checklist
- [ ] `docker-compose up` starts all services
- [ ] PostgreSQL accessible on port 5432
- [ ] n8n accessible on port 5678
- [ ] Strapi connects to containerized DB
- [ ] All services communicate correctly

### Next Step
Proceed to **Phase 7: CI/CD & Deployment**

---

## Phase 7: CI/CD & Deployment
**Status:** NOT STARTED
**Dependencies:** Phase 6 complete
**Estimated Effort:** 1-2 sessions

### Tasks
- [ ] Create GitHub Actions deploy workflow
- [ ] Create PR preview workflow
- [ ] Create scheduled publish workflow
- [ ] Configure Vercel project
- [ ] Configure Railway/Render for CMS
- [ ] Set up environment secrets
- [ ] Document deployment process

### Files to Create
```
.github/
└── workflows/
    ├── deploy.yml              # Production deployment
    ├── preview.yml             # PR previews
    ├── scheduled-publish.yml   # Scheduled content
    └── content-sync.yml        # CMS sync
```

### Validation Checklist
- [ ] Push to main triggers deploy
- [ ] PR creates preview environment
- [ ] Scheduled workflow runs on time
- [ ] Environment variables accessible
- [ ] Deployment completes successfully
- [ ] Production site accessible

### Next Step
Proceed to **Phase 8: Content Templates & Documentation**

---

## Phase 8: Content Templates & Documentation
**Status:** NOT STARTED
**Dependencies:** Phase 7 complete
**Estimated Effort:** 1 session

### Tasks
- [ ] Create content template documents
- [ ] Write brand voice guide
- [ ] Write style guide
- [ ] Create SEO checklist
- [ ] Document all workflows
- [ ] Create setup documentation
- [ ] Write contribution guidelines

### Files to Create
```
content/
├── templates/
│   ├── how-to-guide.md
│   ├── news-analysis.md
│   ├── case-study.md
│   └── thought-leadership.md
├── style-guide.md
└── brand-voice.md

docs/
├── setup.md
├── workflows.md
├── content-guidelines.md
├── seo-checklist.md
└── deployment.md
```

### Validation Checklist
- [ ] All templates follow consistent format
- [ ] Documentation is complete and accurate
- [ ] New developer can set up project from docs
- [ ] Content team can use templates

### Next Step
Proceed to **Phase 9: Analytics & Monitoring**

---

## Phase 9: Analytics & Monitoring
**Status:** NOT STARTED
**Dependencies:** Phase 8 complete
**Estimated Effort:** 1 session

### Tasks
- [ ] Integrate Google Analytics 4
- [ ] Integrate Plausible Analytics
- [ ] Set up Google Search Console
- [ ] Create analytics dashboard
- [ ] Configure error monitoring (optional)
- [ ] Set up uptime monitoring (optional)

### Files to Create/Modify
```
apps/web/
├── components/
│   └── analytics/
│       ├── GoogleAnalytics.tsx
│       └── Plausible.tsx
└── app/
    └── layout.tsx              # Add analytics scripts
```

### Validation Checklist
- [ ] GA4 tracking fires on page views
- [ ] Plausible dashboard shows data
- [ ] Search Console verified
- [ ] Custom events track correctly

### Next Step
Proceed to **Phase 10: Launch Preparation**

---

## Phase 10: Launch Preparation
**Status:** NOT STARTED
**Dependencies:** Phases 1-9 complete
**Estimated Effort:** 1-2 sessions

### Tasks
- [ ] Create seed content (5-10 articles)
- [ ] Performance audit (Lighthouse)
- [ ] Security audit
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Mobile responsiveness check
- [ ] Load testing
- [ ] Final documentation review

### Launch Checklist
- [ ] All validation checkpoints passed
- [ ] Seed content published
- [ ] Analytics confirmed working
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Team trained on workflows
- [ ] DNS configured
- [ ] SSL certificates active

---

## Dependency Graph

```
Phase 0 (Foundation)
    │
    ▼
Phase 1 (Next.js) ──────────────────┐
    │                               │
    ▼                               │
Phase 2 (Strapi CMS) ───────────────┤
    │                               │
    └───────────┬───────────────────┘
                │
                ▼
        Phase 3 (Integration)
                │
                ▼
        Phase 4 (SEO)
                │
                ▼
        Phase 5 (n8n Automation)
                │
                ▼
        Phase 6 (Docker/Infra)
                │
                ▼
        Phase 7 (CI/CD)
                │
                ▼
        Phase 8 (Content/Docs)
                │
                ▼
        Phase 9 (Analytics)
                │
                ▼
        Phase 10 (Launch)
```

---

## Current Status Summary

| Phase | Name | Status | Blocker |
|-------|------|--------|---------|
| 0 | Foundation | COMPLETE ✓ | None |
| 1 | Next.js Frontend | COMPLETE ✓ | None |
| 2 | Strapi CMS | COMPLETE ✓ | None |
| 3 | Integration | COMPLETE ✓ | None |
| 4 | SEO | IN PROGRESS | None |
| 5 | Automation | COMPLETE ✓ | None |
| 6 | Infrastructure | NOT STARTED | Phase 5 |
| 7 | CI/CD | NOT STARTED | Phase 6 |
| 8 | Content/Docs | NOT STARTED | Phase 7 |
| 9 | Analytics | NOT STARTED | Phase 8 |
| 10 | Launch | NOT STARTED | Phase 9 |

---

## Recommended Next Action

**Phases 0-3 and 5 are complete.** The Content Automation Engine is built.

### To Test Content Generation

```bash
cd automation
npm install
npx tsx src/index.ts generate --topic "Your Topic" --pillar ai-automation --dry-run
```

### To Run Full Pipeline (requires valid API keys)

```bash
# Ensure .env has valid ANTHROPIC_API_KEY
npx tsx src/index.ts generate --topic "Your Topic" --pillar ai-automation --status draft
```

### To Test the Systems

**Frontend (Next.js):**
```bash
cd apps/web && npm run dev
# Opens at http://localhost:3000
```

**CMS (Strapi):**
```bash
cd cms && npm run develop
# Opens at http://localhost:1337/admin
# First run will prompt to create admin user
```

### Next Prompt
> "Build Phase 3: Connect the Next.js frontend to Strapi CMS. Implement the CMS client, fetch real articles, and update the blog pages to use live data."

---

*Last Updated: January 2026*
*Document Version: 1.2*
