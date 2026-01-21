import { NextRequest, NextResponse } from 'next/server';

/**
 * Vercel Cron Job: Generate Daily Blog Post
 *
 * This endpoint is triggered by Vercel Cron at 6:00 AM daily (configured in vercel.json)
 * It calls the external automation service to generate a new blog post.
 *
 * Security: Vercel automatically adds CRON_SECRET header for verification
 */

export const runtime = 'edge';
export const maxDuration = 60;

interface GenerationResult {
  success: boolean;
  article?: {
    title: string;
    slug: string;
    documentId: string;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if automation service URL is configured
  const automationUrl = process.env.AUTOMATION_SERVICE_URL;

  if (!automationUrl) {
    // If no external automation service, return info about manual setup
    return NextResponse.json({
      success: false,
      message: 'Automation service not configured',
      instructions: [
        'Set AUTOMATION_SERVICE_URL environment variable',
        'Or run automation locally: npm run daily',
        'Or use n8n workflow for scheduled generation',
      ],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Call the automation service
    const response = await fetch(`${automationUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AUTOMATION_API_KEY || ''}`,
      },
      body: JSON.stringify({
        mode: 'daily',
        publishStatus: 'draft',
      }),
    });

    if (!response.ok) {
      throw new Error(`Automation service error: ${response.status}`);
    }

    const result: GenerationResult = await response.json();

    // Revalidate the blog pages to show new content
    if (result.success && result.article) {
      try {
        // Trigger ISR revalidation
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=/blog`, {
          method: 'POST',
        });
      } catch {
        // Revalidation is best-effort
      }
    }

    return NextResponse.json({
      success: result.success,
      article: result.article,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
