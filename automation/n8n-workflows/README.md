# n8n Workflows for AUTOBLOG

This directory contains n8n workflow JSON files for automating content generation and distribution.

## Available Workflows

### 1. content-generation.json
**Main content pipeline** - Generates articles using Claude AI, creates hero images with DALL-E 3, and publishes to Strapi CMS.

**Trigger:** Daily schedule (configurable)

**Flow:**
1. Build prompts based on content calendar
2. Generate article with Claude API
3. Parse and validate response
4. Generate hero image with DALL-E 3
5. Create article in Strapi CMS
6. Notify team via Slack

### 2. seo-optimization.json (Coming Soon)
**SEO enhancement workflow** - Triggered when articles move to review status.

### 3. image-generation.json (Coming Soon)
**Standalone image generation** - Generate hero images for existing articles.

### 4. social-distribution.json (Coming Soon)
**Social media posting** - Create and schedule posts for Twitter/X and LinkedIn.

### 5. analytics-reporting.json (Coming Soon)
**Weekly reports** - Aggregate analytics and send summaries.

## Setup Instructions

### Prerequisites
- n8n instance running (self-hosted or n8n.cloud)
- API credentials for:
  - Anthropic (Claude API)
  - OpenAI (DALL-E 3)
  - Strapi Cloud
  - Slack (optional, for notifications)

### Import Workflow

1. Open your n8n instance
2. Go to **Workflows** > **Import from File**
3. Select the JSON file you want to import
4. Click **Import**

### Configure Credentials

After importing, configure the following credentials:

#### Claude API (HTTP Header Auth)
- **Name:** `Claude API Key`
- **Header Name:** `x-api-key`
- **Header Value:** Your Anthropic API key

#### OpenAI API (HTTP Header Auth)
- **Name:** `OpenAI API Key`
- **Header Name:** `Authorization`
- **Header Value:** `Bearer sk-your-openai-key`

#### Strapi API (HTTP Header Auth)
- **Name:** `Strapi API Token`
- **Header Name:** `Authorization`
- **Header Value:** `Bearer your-strapi-token`

### Environment Variables

Set these environment variables in n8n:

```
STRAPI_URL=https://your-strapi-instance.strapiapp.com
```

### Activate Workflow

1. Open the imported workflow
2. Review and test each node
3. Toggle the workflow to **Active**

## Customization

### Change Schedule
Edit the "Daily Schedule" node to adjust when content is generated:
- Daily at specific time
- Weekly on certain days
- Custom cron expression

### Modify Content Topics
Edit the "Build Prompts" code node to:
- Add/remove topics
- Change content pillars
- Integrate with external content calendar

### Adjust Article Parameters
Modify the prompts to change:
- Article length
- Writing style
- SEO requirements
- Output format

## Troubleshooting

### Claude API Errors
- Verify API key is correct
- Check rate limits
- Ensure model name is valid

### Image Generation Fails
- OpenAI may reject certain prompts
- Check for content policy violations
- Verify API key has DALL-E access

### Strapi Publishing Fails
- Verify Strapi URL is correct
- Check API token permissions
- Ensure content type schema matches

## Testing

Before activating:
1. Run workflow manually with test data
2. Verify each node completes successfully
3. Check Strapi for created article
4. Confirm Slack notification received

## Support

For issues or questions:
- Check n8n documentation: https://docs.n8n.io
- Review Anthropic API docs: https://docs.anthropic.com
- Strapi Cloud docs: https://docs.strapi.io
