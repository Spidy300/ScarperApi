import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface EpisodeLink {
  episode: string;
  episodeNumber: number;
  url: string;
}

interface LeechProResponse {
  success: boolean;
  data?: {
    title: string;
    episodes: EpisodeLink[];
    totalEpisodes: number;
  };
  error?: string;
  message?: string;
  remainingRequests?: number;
}

function extractEpisodeNumber(text: string): number {
  const episodeMatch = text.match(/Episode\s*(\d+)/i);
  return episodeMatch ? parseInt(episodeMatch[1]) : 0;
}

async function scrapeLeechProEpisodes(url: string): Promise<{ title: string; episodes: EpisodeLink[] } | null> {
  try {
    console.log(`Fetching LeechPro episodes from: ${url}`);

    const response = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://leechpro.blog/',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch episodes: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extract title from the page
    const title = $('h1, .entry-title, .post-title, title').first().text().trim().replace(' - LeechPro', '') || 'Unknown Title';
    
    const episodes: EpisodeLink[] = [];

    // Find all episode links in h3 elements
    $('h3').each((_, element) => {
      const $heading = $(element);
      const $link = $heading.find('a').first();
      
      if ($link.length) {
        const episodeText = $link.text().trim();
        const episodeUrl = $link.attr('href');
        
        // Check if this is an episode link
        if (episodeText.includes('Episode') && episodeUrl) {
          const episodeNumber = extractEpisodeNumber(episodeText);
          
          if (episodeNumber > 0) {
            episodes.push({
              episode: episodeText,
              episodeNumber,
              url: episodeUrl
            });
          }
        }
      }
    });

    // Sort episodes by episode number
    episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

    console.log(`Extracted ${episodes.length} episodes from LeechPro`);
    
    return {
      title,
      episodes
    };

  } catch (error) {
    console.error('Error scraping LeechPro episodes:', error);
    throw error;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<LeechProResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<LeechProResponse>;
    }

    const { searchParams } = new URL(request.url);
    const leechUrl = searchParams.get('url');

    if (!leechUrl) {
      return NextResponse.json<LeechProResponse>(
        { 
          success: false, 
          error: 'URL is required',
          message: 'Please provide a LeechPro page URL parameter'
        },
        { status: 400 }
      );
    }

    // Validate that it's a LeechPro URL
    if (!leechUrl.includes('leechpro.blog')) {
      return NextResponse.json<LeechProResponse>(
        { 
          success: false, 
          error: 'Invalid URL',
          message: 'URL must be from leechpro.blog'
        },
        { status: 400 }
      );
    }

    console.log('Processing LeechPro request for URL:', leechUrl);

    const episodeData = await scrapeLeechProEpisodes(leechUrl);

    if (!episodeData || episodeData.episodes.length === 0) {
      return NextResponse.json<LeechProResponse>({
        success: false,
        error: 'No episodes found',
        message: 'No episode download links could be extracted from the provided URL',
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    return NextResponse.json<LeechProResponse>({
      success: true,
      data: {
        title: episodeData.title,
        episodes: episodeData.episodes,
        totalEpisodes: episodeData.episodes.length
      },
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('LeechPro API error:', error);
    
    return NextResponse.json<LeechProResponse>(
      { 
        success: false, 
        error: 'Failed to extract episode links',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
