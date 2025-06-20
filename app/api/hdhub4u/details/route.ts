import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface EpisodeLink {
  episode: string;
  episodeNumber: number;
  episodeUrl: string;
}

interface DownloadLink {
  title: string;
  quality: string;
  size: string;
  downloadUrl: string;
}

interface DirectDownloadLink {
  title: string;
  quality: string;
  size: string;
  downloadUrl: string;
  watchUrl?: string;
  playerUrl?: string;
}

interface HDHub4uDetailsResponse {
  success: boolean;
  data?: {
    title: string;
    type: 'series' | 'movie' | 'movie_direct';
    episodes?: EpisodeLink[];
    downloads?: DownloadLink[];
    directDownloads?: DirectDownloadLink[];
  };
  error?: string;
  message?: string;
  remainingRequests?: number;
}

function extractEpisodeNumber(text: string): number {
  const episodeMatch = text.match(/EPISODE\s*(\d+)/i);
  return episodeMatch ? parseInt(episodeMatch[1]) : 0;
}

function extractQualityAndSize(title: string): { quality: string; size: string } {
  // Extract quality (480p, 720p, 1080p, etc.)
  const qualityMatch = title.match(/(\d+p|4K|UHD)/i);
  const quality = qualityMatch ? qualityMatch[1] : 'Unknown';
  
  // Extract size ([100MB], [300MB], [600MB], etc.)
  const sizeMatch = title.match(/\[([^\]]+(?:MB|GB)[^\]]*)\]/i);
  const size = sizeMatch ? sizeMatch[1] : 'Unknown';
  
  return { quality, size };
}

async function scrapeHDHub4uDetails(url: string): Promise<{ title: string; type: 'series' | 'movie' | 'movie_direct'; episodes?: EpisodeLink[]; downloads?: DownloadLink[]; directDownloads?: DirectDownloadLink[] } | null> {
  try {
    console.log(`Fetching HDHub4u details from: ${url}`);

    const response = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://hdhub4u.gratis/',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch details: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extract title from the page
    const title = $('h1, .entry-title, .post-title, title').first().text().trim().replace(' - HDHub4u', '') || 'Unknown Title';
    
    const episodes: EpisodeLink[] = [];
    const downloads: DownloadLink[] = [];
    const directDownloads: DirectDownloadLink[] = [];

    // Check content type based on what's present
    const hasEpisodes = $('h4').text().includes('EPISODE') || $('a[href*="techyboy4u.com"]').length > 0;
    const hasDirectDownloads = $('a[href*="hubdrive.wales"], a[href*="hdstream4u.com"], a[href*="hubstream.art"]').length > 0;

    if (hasEpisodes) {
      // Handle TV series logic (existing code)
      $('h4').each((_, element) => {
        const $heading = $(element);
        const headingText = $heading.text().trim();
        
        if (headingText.includes('EPISODE')) {
          const $links = $heading.find('a');
          let episodeUrl = '';
          let episodeText = '';
          
          $links.each((_, linkElement) => {
            const $link = $(linkElement);
            const linkText = $link.text().trim();
            const linkHref = $link.attr('href');
            
            if (linkText.includes('EPISODE') && linkHref) {
              episodeText = linkText;
              episodeUrl = linkHref;
            }
          });
          
          if (episodeText && episodeUrl) {
            const episodeNumber = extractEpisodeNumber(episodeText);
            
            if (episodeNumber > 0) {
              episodes.push({
                episode: episodeText,
                episodeNumber,
                episodeUrl
              });
            }
          }
        }
      });

      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
      
      console.log(`Extracted ${episodes.length} episodes from HDHub4u details`);
      
      return {
        title,
        type: 'series',
        episodes
      };
      
    } else if (hasDirectDownloads) {
      // Handle direct download links (hubdrive, hdstream4u, etc.)
      $('h3, h4').each((_, element) => {
        const $heading = $(element);
        const $link = $heading.find('a').first();
        const linkText = $link.text().trim();
        const linkHref = $link.attr('href');
        
        if (linkHref && (linkText.includes('p ') || linkText.includes('MB') || linkText.includes('GB'))) {
          const { quality, size } = extractQualityAndSize(linkText);
          
          // Check for watch/player links in the same or next element
          let watchUrl = '';
          let playerUrl = '';
          
          // Look for watch/player links in the next h4
          const $nextH4 = $heading.next('h4');
          if ($nextH4.length) {
            $nextH4.find('a').each((_, watchLink) => {
              const $watchLink = $(watchLink);
              const watchText = $watchLink.text().trim();
              const watchHref = $watchLink.attr('href');
              
              if (watchText.includes('WATCH') && watchHref) {
                watchUrl = watchHref;
              } else if (watchText.includes('PLAYER') && watchHref) {
                playerUrl = watchHref;
              }
            });
          }
          
          directDownloads.push({
            title: linkText,
            quality,
            size,
            downloadUrl: linkHref,
            watchUrl: watchUrl || undefined,
            playerUrl: playerUrl || undefined
          });
        }
      });

      console.log(`Extracted ${directDownloads.length} direct download links from HDHub4u details`);
      
      return {
        title,
        type: 'movie_direct',
        directDownloads
      };
      
    } else {
      // Extract movie download links (existing logic)
      $('h3, h4, .download-section, .entry-content p').each((_, element) => {
        const $element = $(element);
        const text = $element.text().trim();
        
        if ((text.includes('Download') || text.includes('DOWNLOAD')) && 
            (text.includes('MB') || text.includes('GB') || text.includes('480p') || text.includes('720p') || text.includes('1080p'))) {
          
          const { quality, size } = extractQualityAndSize(text);
          
          const $downloadLink = $element.find('a').first() || $element.next().find('a').first();
          const downloadUrl = $downloadLink.attr('href');
          
          if (downloadUrl) {
            downloads.push({
              title: text,
              quality,
              size,
              downloadUrl
            });
          }
        }
      });

      $('.entry-content a, .download-links a').each((_, element) => {
        const $link = $(element);
        const linkText = $link.text().trim();
        const linkHref = $link.attr('href');
        
        if (linkHref && (linkText.includes('Download') || linkText.includes('480p') || linkText.includes('720p') || linkText.includes('1080p'))) {
          const { quality, size } = extractQualityAndSize(linkText);
          
          const exists = downloads.some(d => d.downloadUrl === linkHref);
          if (!exists) {
            downloads.push({
              title: linkText,
              quality,
              size,
              downloadUrl: linkHref
            });
          }
        }
      });

      console.log(`Extracted ${downloads.length} download links from HDHub4u details`);
      
      return {
        title,
        type: 'movie',
        downloads
      };
    }

  } catch (error) {
    console.error('Error scraping HDHub4u details:', error);
    throw error;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<HDHub4uDetailsResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<HDHub4uDetailsResponse>;
    }

    const { searchParams } = new URL(request.url);
    const detailUrl = searchParams.get('url');

    if (!detailUrl) {
      return NextResponse.json<HDHub4uDetailsResponse>(
        { 
          success: false, 
          error: 'URL is required',
          message: 'Please provide a HDHub4u detail page URL parameter'
        },
        { status: 400 }
      );
    }

    // Validate that it's a HDHub4u URL
    if (!detailUrl.includes('hdhub4u')) {
      return NextResponse.json<HDHub4uDetailsResponse>(
        { 
          success: false, 
          error: 'Invalid URL',
          message: 'URL must be from hdhub4u.gratis'
        },
        { status: 400 }
      );
    }

    console.log('Processing HDHub4u details request for URL:', detailUrl);

    const details = await scrapeHDHub4uDetails(detailUrl);

    if (!details) {
      return NextResponse.json<HDHub4uDetailsResponse>({
        success: false,
        error: 'No content found',
        message: 'No content could be extracted from the provided URL',
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    const hasContent = details.type === 'series' 
      ? details.episodes && details.episodes.length > 0
      : details.type === 'movie_direct'
      ? details.directDownloads && details.directDownloads.length > 0
      : details.downloads && details.downloads.length > 0;

    if (!hasContent) {
      return NextResponse.json<HDHub4uDetailsResponse>({
        success: false,
        error: 'No links found',
        message: 'No download or episode links could be extracted from the provided URL',
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    return NextResponse.json<HDHub4uDetailsResponse>({
      success: true,
      data: details,
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('HDHub4u details API error:', error);
    
    return NextResponse.json<HDHub4uDetailsResponse>(
      { 
        success: false, 
        error: 'Failed to extract content',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
