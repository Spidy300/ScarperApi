import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface ShowboxItem {
  id: string;
  title: string;
  imageUrl: string;
  postUrl: string;
  type?: 'movie' | 'tv';
  year?: string;
  rating?: string;
  quality?: string;
}

interface ShowboxResponse {
  success: boolean;
  data?: {
    items: ShowboxItem[];
    query?: string;
    totalResults: number;
    page: number;
  };
  error?: string;
  message?: string;
  remainingRequests?: number;
}

// Function to normalize image URLs
function normalizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return 'https://www.showbox.media' + url;
  return url;
}

// Function to generate ID from URL
function generateIdFromUrl(url: string): string {
  try {
    const urlParts = url.split('/');
    const relevantPart = urlParts.find(part => 
      part.length > 5 && !part.includes('showbox.media')
    );
    return relevantPart ? relevantPart.replace(/[^a-zA-Z0-9-]/g, '') : '';
  } catch {
    return '';
  }
}

// Headers for Showbox requests - exact match from React Native
const sbHeaders = {
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.9,en-IN;q=0.8',
  'cache-control': 'no-cache',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  pragma: 'no-cache',
  priority: 'u=1, i',
  'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Microsoft Edge";v="134"',
  'sec-ch-ua-arch': '"x86"',
  'sec-ch-ua-bitness': '"64"',
  'sec-ch-ua-full-version': '"134.0.3124.83"',
  'sec-ch-ua-full-version-list': '"Chromium";v="134.0.6998.118", "Not:A-Brand";v="24.0.0.0", "Microsoft Edge";v="134.0.3124.83"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-model': '""',
  'sec-ch-ua-platform': '"Windows"',
  'sec-ch-ua-platform-version': '"19.0.0"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest',
  cookie: 'ext_name=ojplmecpdpgccookcobabopnaifgidhf; ci=167dea138333aa; cf_clearance=F3Z5jQdACVu5drghUljgmK3dhdEOZYzsniaa0NdJVNA-1742648415-1.2.1.1-d.Ca2P0QkU14cC0m2vtrvJVSBuwxHAt97GLurkp77PhO8ds7ttvUi4rT70ynq0B0shpfbnBRT0G767aiVcn3K4Pee2kOH_mhpcZQsaba8XYDtv40uA1bOW5H0Ec3rW_ZVI8OHbcc8LOTAEinRFMrUQx1ndtX774eZ4SiDFDofRSJ.UClV22dKqe1qRxAPlBXUl2we9ZaVt3YUFebfaRSup1eqZ8OLDP05X2X3CDk5QBMlPbSgU.cLyJYevWBbcsAh3Jo8UnMBghAcSGwhHeq.bgL4SfK4qLBej9rh7FdTxksN0MsovGgucUNyud_sOrLWMZ.uLlgUAApoXrYR.5PwJODNEFesP9rDXNxwR3PcMc',
  Referer: 'https://www.showbox.media/movie/m-captain-america-brave-new-world-2024',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Main function to scrape Showbox search results
async function scrapeShowboxSearch(searchQuery: string, page: number = 1): Promise<ShowboxItem[]> {
  try {
    const baseUrl = 'https://www.showbox.media';
    const searchUrl = `${baseUrl}/search?keyword=${encodeURIComponent(searchQuery)}&page=${page}`;
    
    console.log(`Searching Showbox with query: ${searchQuery}, page: ${page}`);
    console.log(`Search URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: sbHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch search results: ${response.status}`);
    }

    const html = await response.text();
    return parseShowboxContent(html, searchQuery, baseUrl);
  } catch (error) {
    console.error('Error scraping Showbox search results:', error);
    throw error;
  }
}

// Function to scrape content from homepage or category pages
async function scrapeShowboxContent(filter: string = '', page: number = 1): Promise<ShowboxItem[]> {
  try {
    const baseUrl = 'https://www.showbox.media';
    const url = filter 
      ? `${baseUrl}${filter}?page=${page}/`
      : `${baseUrl}/?page=${page}/`;
    
    console.log(`Fetching Showbox content from: ${url}`);

    const response = await fetch(url, {
      headers: sbHeaders,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`);
    }

    const html = await response.text();
    return parseShowboxContent(html, undefined, baseUrl);
  } catch (error) {
    console.error('Error scraping Showbox content:', error);
    throw error;
  }
}

// Helper function to parse Showbox HTML content
function parseShowboxContent(html: string, searchQuery?: string, baseUrl: string = 'https://www.showbox.media'): ShowboxItem[] {
  const $ = load(html);
  const items: ShowboxItem[] = [];

  // Process content from .flw-item elements
  $('.flw-item').each((_, element) => {
    const $element = $(element);
    
    // Extract title from .film-name
    const title = $element.find('.film-name').text().trim();
    
    // Extract post URL from .film-name a
    const link = $element.find('.film-name').find('a').attr('href');
    const postUrl = link?.startsWith('http') ? link : `${baseUrl}${link}`;
    
    // Extract image from .film-poster-img
    let image = $element.find('.film-poster-img').attr('src') || '';
    const imageUrl = image?.startsWith('http') ? image : `${baseUrl}${image}`;
    
    // Extract quality if available
    const quality = $element.find('.film-poster-quality').text().trim();
    
    // Extract type and year from .fd-infor
    const infoText = $element.find('.fd-infor').text().trim();
    let type: 'movie' | 'tv' | undefined;
    let year: string | undefined;
    
    // Determine type from URL or content
    if (postUrl?.includes('/movie/')) {
      type = 'movie';
    } else if (postUrl?.includes('/tv/')) {
      type = 'tv';
    }
    
    // Extract year from info text
    const yearMatch = infoText.match(/(\d{4})/);
    if (yearMatch) {
      year = yearMatch[1];
    }
    
    if (title && postUrl && imageUrl) {
      // Generate ID from URL
      const id = generateIdFromUrl(postUrl) || `showbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      items.push({
        id,
        title,
        imageUrl,
        postUrl,
        type,
        year,
        quality: quality || undefined
      });
    }
  });

  console.log(`Successfully parsed ${items.length} ${searchQuery ? 'search results' : 'content items'}`);
  return items;
}

export async function GET(request: NextRequest): Promise<NextResponse<ShowboxResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<ShowboxResponse>;
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || searchParams.get('keyword');
    const filter = searchParams.get('filter') || '';
    const page = parseInt(searchParams.get('page') || '1');

    if (page < 1) {
      return NextResponse.json<ShowboxResponse>(
        { 
          success: false, 
          error: 'Page number must be 1 or greater' 
        },
        { status: 400 }
      );
    }

    console.log('Processing Showbox request:', { searchQuery, filter, page });

    let items: ShowboxItem[] = [];

    if (searchQuery && searchQuery.trim()) {
      // Perform search
      items = await scrapeShowboxSearch(searchQuery.trim(), page);
    } else {
      // Get content from homepage or filter
      items = await scrapeShowboxContent(filter, page);
    }

    if (!items || items.length === 0) {
      return NextResponse.json<ShowboxResponse>({
        success: false,
        error: 'No content found',
        message: searchQuery 
          ? `No results found for search query: "${searchQuery}"` 
          : `No content found on page ${page}`,
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    return NextResponse.json<ShowboxResponse>({
      success: true,
      data: {
        items,
        query: searchQuery || undefined,
        totalResults: items.length,
        page
      },
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('Showbox API error:', error);
    
    return NextResponse.json<ShowboxResponse>(
      { 
        success: false, 
        error: 'Failed to fetch content from Showbox',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
