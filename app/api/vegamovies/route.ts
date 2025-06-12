import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface VegaMovie {
  id: string;
  title: string;
  url: string;
  image: string;
  imageAlt: string;
  publishDate: string;
  category: string;
  quality: string[];
  language: string[];
  size: string[];
  format: string;
  featured: boolean;
}

interface VegaMoviesResponse {
  success: boolean;
  data?: {
    movies: VegaMovie[];
    pagination?: {
      currentPage: number;
      hasNextPage: boolean;
    };
  };
  error?: string;
  message?: string;
  remainingRequests?: number;
}

async function scrapeVegaMovies(page: number = 1, searchQuery?: string): Promise<VegaMovie[]> {
  try {
    let url = 'https://vegamovies.yoga/';
    
    if (searchQuery) {
      url += `?s=${encodeURIComponent(searchQuery)}`;
    } else if (page > 1) {
      url += `page/${page}/`;
    }

    console.log(`Fetching VegaMovies from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://vegamovies.yoga/',
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch VegaMovies: ${response.status}`);
    }

    const html: string = await response.text();
    console.log(`Received HTML length: ${html.length}`);
    
    const movies: VegaMovie[] = [];

    // Extract article elements using regex - try multiple patterns
    let articleMatches = html.match(/<article[^>]*class="[^"]*post[^"]*"[^>]*>[\s\S]*?<\/article>/gi);
    
    // If no articles found, try alternative patterns
    if (!articleMatches) {
      console.log('No articles found with standard pattern, trying alternatives...');
      articleMatches = html.match(/<article[^>]*>[\s\S]*?<\/article>/gi);
    }
    
    if (!articleMatches) {
      console.log('No articles found with any pattern. Checking for other content...');
      // Log a sample of the HTML to see what structure we're getting
      console.log('HTML sample:', html.substring(0, 1000));
      return movies;
    }

    console.log(`Found ${articleMatches.length} article elements`);

    for (let i = 0; i < articleMatches.length; i++) {
      const articleHtml = articleMatches[i];
      try {
        // Extract post ID
        const idMatch = articleHtml.match(/id="post-(\d+)"/);
        const id = idMatch ? idMatch[1] : `article-${i}`;

        // Extract title and URL - try multiple patterns
        let titleMatch = articleHtml.match(/<h2[^>]*class="post-title[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/a>/i);
        
        if (!titleMatch) {
          // Try alternative title patterns
          titleMatch = articleHtml.match(/<h[1-6][^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/a>/i);
        }
        
        if (!titleMatch) {
          console.log(`No title found for article ${i}`);
          continue;
        }

        const url = titleMatch[1];
        let title = titleMatch[2]
          .replace(/<[^>]+>/g, '') // Remove HTML tags
          .replace(/&#8211;/g, '–') // Replace HTML entities
          .replace(/&#038;/g, '&')
          .trim();

        // Extract image information
        const imageMatch = articleHtml.match(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/i);
        const image = imageMatch ? imageMatch[1] : '';
        const imageAlt = imageMatch ? imageMatch[2] : '';

        // Extract publish date
        const dateMatch = articleHtml.match(/<time[^>]+datetime="([^"]+)"/i);
        const publishDate = dateMatch ? dateMatch[1] : new Date().toISOString();

        // Extract format/category from post-comments
        const formatMatch = articleHtml.match(/<a[^>]+class="post-comments"[^>]*>([^<]+)<\/a>/i);
        const format = formatMatch ? formatMatch[1].trim() : 'Unknown';

        // Check if featured
        const featured = articleHtml.includes('category-featured');

        // Extract quality, language, and size from title
        const qualities: string[] = [];
        const languages: string[] = [];
        const sizes: string[] = [];

        // Quality extraction
        const qualityMatches = title.match(/\b(480p|720p|1080p|2160p|4K)\b/gi);
        if (qualityMatches) {
          qualities.push(...qualityMatches.map(q => q.toUpperCase()));
        }

        // Language extraction
        const languageMatches = title.match(/\b(Hindi|English|Tamil|Telugu|Malayalam|Kannada|Multi|Dual\s*Audio)\b/gi);
        if (languageMatches) {
          languages.push(...languageMatches);
        }

        // Size extraction
        const sizeMatches = title.match(/\[([0-9.]+(?:MB|GB))\]/gi);
        if (sizeMatches) {
          sizes.push(...sizeMatches.map(s => s.replace(/[\[\]]/g, '')));
        }

        // Extract categories from class
        const categoryMatches = articleHtml.match(/category-([a-zA-Z0-9-]+)/g);
        const categories = categoryMatches ? categoryMatches.map(c => c.replace('category-', '')) : [];
        
        // Determine main category
        let category = 'Movie';
        if (categories.includes('dual-audio-series') || title.toLowerCase().includes('season')) {
          category = 'TV Series';
        } else if (categories.includes('animation')) {
          category = 'Animation';
        } else if (categories.includes('documentary')) {
          category = 'Documentary';
        }

        if (id && title && url) {
          movies.push({
            id,
            title,
            url,
            image,
            imageAlt,
            publishDate,
            category,
            quality: [...new Set(qualities)], // Remove duplicates
            language: [...new Set(languages)],
            size: [...new Set(sizes)],
            format,
            featured
          });
        } else {
          console.log(`Skipping article ${i} - missing required fields:`, { id, title: !!title, url: !!url });
        }
      } catch (error) {
        console.error(`Error parsing article ${i}:`, error);
        continue;
      }
    }

    console.log(`Successfully scraped ${movies.length} movies from VegaMovies`);
    return movies;

  } catch (error) {
    console.error('Error scraping VegaMovies:', error);
    throw error;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<VegaMoviesResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<VegaMoviesResponse>;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const searchQuery = searchParams.get('search');

    if (page < 1) {
      return NextResponse.json<VegaMoviesResponse>(
        { 
          success: false, 
          error: 'Page number must be 1 or greater' 
        },
        { status: 400 }
      );
    }

    console.log('Processing VegaMovies request:', { page, searchQuery });

    const movies = await scrapeVegaMovies(page, searchQuery || undefined);

    if (!movies || movies.length === 0) {
      return NextResponse.json<VegaMoviesResponse>({
        success: false,
        error: 'No movies found',
        message: searchQuery 
          ? `No movies found for search query: "${searchQuery}"` 
          : `No movies found on page ${page}`,
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    return NextResponse.json<VegaMoviesResponse>({
      success: true,
      data: {
        movies,
        pagination: {
          currentPage: page,
          hasNextPage: movies.length >= 10 // Assume there's more if we got a full page
        }
      },
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('VegaMovies API error:', error);
    
    return NextResponse.json<VegaMoviesResponse>(
      { 
        success: false, 
        error: 'Failed to fetch movies from VegaMovies',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
