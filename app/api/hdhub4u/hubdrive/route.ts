import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface HubCloudLink {
  title: string;
  url: string;
  server: string;
}

interface HubDriveResponse {
  success: boolean;
  data?: {
    hubdriveUrl: string;
    hubcloudLinks: HubCloudLink[];
  };
  error?: string;
  message?: string;
  remainingRequests?: number;
}

async function extractHubCloudLinks(url: string): Promise<{ hubcloudLinks: HubCloudLink[] } | null> {
  try {
    console.log('Fetching HubDrive page:', url);

    const response = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://hubdrive.wales/',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch HubDrive page: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);

    const hubcloudLinks: HubCloudLink[] = [];

    // Extract HubCloud links
    $('h5 a.btn-success1, h5 a[href*="hubcloud"]').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const text = $link.text().trim();
      
      if (href && href.includes('hubcloud')) {
        hubcloudLinks.push({
          title: text || 'HubCloud Link',
          url: href,
          server: 'HubCloud'
        });
      }
    });

    console.log(`Extracted ${hubcloudLinks.length} HubCloud links`);

    return {
      hubcloudLinks
    };

  } catch (error) {
    console.error('Error extracting HubCloud links:', error);
    throw error;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<HubDriveResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<HubDriveResponse>;
    }

    const { searchParams } = new URL(request.url);
    const hubdriveUrl = searchParams.get('url');

    if (!hubdriveUrl) {
      return NextResponse.json<HubDriveResponse>(
        { 
          success: false, 
          error: 'HubDrive URL is required',
          message: 'Please provide a HubDrive Wales URL parameter'
        },
        { status: 400 }
      );
    }

    // Validate that it's a HubDrive Wales URL
    if (!hubdriveUrl.includes('hubdrive.wales')) {
      return NextResponse.json<HubDriveResponse>(
        { 
          success: false, 
          error: 'Invalid URL',
          message: 'URL must be from hubdrive.wales'
        },
        { status: 400 }
      );
    }

    console.log('Processing HubDrive request for URL:', hubdriveUrl);

    const extractedData = await extractHubCloudLinks(hubdriveUrl);

    if (!extractedData || extractedData.hubcloudLinks.length === 0) {
      return NextResponse.json<HubDriveResponse>({
        success: false,
        error: 'No HubCloud links found',
        message: 'No HubCloud links could be extracted from the provided HubDrive URL',
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    return NextResponse.json<HubDriveResponse>({
      success: true,
      data: {
        hubdriveUrl,
        hubcloudLinks: extractedData.hubcloudLinks
      },
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('HubDrive API error:', error);
    
    return NextResponse.json<HubDriveResponse>(
      { 
        success: false, 
        error: 'Failed to extract HubCloud links',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
