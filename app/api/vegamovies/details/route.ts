import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';
import * as cheerio from 'cheerio';

interface DownloadLink {
  type: 'G-Direct' | 'V-Cloud' | 'Other' | 'Batch';
  url: string;
  resumable?: boolean;
}

interface SeasonQuality {
  quality: string;
  language?: string;
  size?: string;
  vCloudLink?: string;
  allLinks?: DownloadLink[];
}

interface SeasonData {
  seasonNumber: string;
  qualities: SeasonQuality[];
}

interface SeriesInfo {
  title?: string;
  imdbRating?: string;
  imdbUrl?: string;
  seriesName?: string;
  movieName?: string; // Add this for movies
  season?: string;
  episode?: string;
  language?: string;
  subtitle?: string;
  releasedYear?: string;
  releaseYear?: string; // Add this for movies
  episodeSize?: string;
  size?: string; // Add this for movies
  completeZip?: string;
  quality?: string;
  format?: string;
  contentType?: 'series' | 'movie'; // Add this to identify content type
}

interface MovieQuality {
  quality: string;
  language?: string;
  size?: string;
  downloadLink?: string;
}

interface VegaMovieDetails {
  seriesInfo?: SeriesInfo;
  synopsis?: string;
  seasonQualities?: SeasonQuality[];
  movieQualities?: MovieQuality[]; // Add this for movie downloads
  seriesInfoHeaderText?: string;
  debugH3Content?: string;
  sourceUrl: string;
}

interface VegaMovieDetailsResponse {
  success: boolean;
  data?: VegaMovieDetails;
  error?: string;
  message?: string;
  remainingRequests?: number;
}

function extractSeasonHeaders(html: string): SeasonQuality[] {
  const seasonQualities: SeasonQuality[] = [];
  const $ = cheerio.load(html);
  
  // Find all h3 season headers
  $('h3[style*="text-align: center"] strong span').each((index, element) => {
    const parentH3 = $(element).closest('h3');
    const headerText = parentH3.text();
    
    if (headerText.includes('Season')) {
      // Find the next paragraph with download links
      const nextP = parentH3.next('p[style*="text-align: center"]');
      
      let vCloudLink = '';
      
      // Look for V-Cloud link in the next paragraph
      nextP.find('a').each((i, linkElement) => {
        const button = $(linkElement).find('button');
        const buttonText = button.text();
        
        if (buttonText.includes('V-Cloud')) {
          vCloudLink = $(linkElement).attr('href') || '';
        }
      });
      
      if (vCloudLink) {
        seasonQualities.push({
          quality: headerText.trim(),
          vCloudLink: vCloudLink
        });
      }
    }
  });
  
  return seasonQualities;
}

function extractMovieDownloads(html: string): MovieQuality[] {
  const movieQualities: MovieQuality[] = [];
  const $ = cheerio.load(html);
  
  // Find all h5 movie quality headers - handle both patterns
  $('h5[style*="text-align: center"]').each((index, element) => {
    const headerText = $(element).text();
    const headerHtml = $(element).html();
    
    // Check if it contains movie info (year, quality, size) - more flexible patterns
    const hasYear = headerText.match(/\(\d{4}\)/);
    const hasQuality = headerText.match(/(480p|720p|1080p|2160p)/i);
    const hasSize = headerText.match(/\[([^\]]+(?:MB|GB))\]/i);
    
    if (hasYear && hasQuality) {
      // Find the next paragraph with download link
      const nextP = $(element).next('p[style*="text-align: center"]');
      
      let downloadLink = '';
      
      // Look for download button in the next paragraph
      nextP.find('a').each((i, linkElement) => {
        const button = $(linkElement).find('button');
        const buttonText = button.text();
        
        if (buttonText.includes('Download Now')) {
          downloadLink = $(linkElement).attr('href') || '';
        }
      });
      
      if (downloadLink) {
        // Extract quality info from header text
        const qualityMatch = headerText.match(/(480p|720p|1080p|2160p)/i);
        const sizeMatch = headerText.match(/\[([^\]]+(?:MB|GB))\]/i);
        
        // Extract language from both patterns
        let language = '';
        // Pattern 1: <span style="color:orange;">[Hindi HQ + Tamil]</span>
        const languageMatch1 = headerHtml?.match(/<span[^>]*color[^>]*orange[^>]*>\[([^\]]+)\]<\/span>/i);
        // Pattern 2: <span style="color: #ffa500;">English-Audio</span>
        const languageMatch2 = headerHtml?.match(/<span[^>]*color[^>]*#ffa500[^>]*>([^<]+)<\/span>/i);
        
        if (languageMatch1) {
          language = languageMatch1[1];
        } else if (languageMatch2) {
          language = languageMatch2[1];
        }
        
        movieQualities.push({
          quality: headerText.trim(),
          language: language || undefined,
          size: sizeMatch ? sizeMatch[1] : undefined,
          downloadLink: downloadLink
        });
      }
    }
  });
  
  return movieQualities;
}

function extractSeriesInfo(html: string): { seriesInfo: SeriesInfo; headerText: string; debugContent: string } {
  const $ = cheerio.load(html);
  const seriesInfo: SeriesInfo = {};
  
  // Extract title
  const titleElement = $('h3 span[style*="color: #eef425"]');
  if (titleElement.length) {
    seriesInfo.title = titleElement.text().trim();
  }
  
  // Debug: Find ALL h3 elements with the class and log their content
  const allH3WithClass = $('h3.fittexted_for_content_h3');
  console.log(`Found ${allH3WithClass.length} h3 elements with class fittexted_for_content_h3`);
  
  let debugContent = '';
  allH3WithClass.each((i, el) => {
    const content = $(el).html();
    const text = $(el).text();
    console.log(`H3 ${i}: Text="${text}", HTML="${content}"`);
    debugContent += `H3 ${i}: ${text} | `;
  });
  
  // Find the "Series Info:" span using the exact HTML structure
  const seriesInfoHeader = $('h3.fittexted_for_content_h3 strong span[style*="color: #ffffff"]').filter((i, el) => {
    return $(el).text().includes('Series Info:');
  });
  
  const headerText = seriesInfoHeader.length ? seriesInfoHeader.text() : 'Not found';
  console.log("Found Series Info header:", seriesInfoHeader.length, headerText);
  
  let seriesInfoP;
  if (seriesInfoHeader.length) {
    const parentH3 = seriesInfoHeader.closest('h3');
    seriesInfoP = parentH3.next('p');
  } else {
    // Fallback: look for paragraph containing "Series Name:" OR "Movie Name:"
    seriesInfoP = $('p').filter((i, el) => {
      const text = $(el).text();
      return text.includes('Series Name:') || text.includes('Movie Name:') || text.includes('IMDb Rating:');
    });
    
    console.log(`Found ${seriesInfoP.length} paragraphs with movie/series info`);
    seriesInfoP.each((i, el) => {
      console.log(`Info paragraph ${i}:`, $(el).text().substring(0, 100));
    });
  }
  
  if (seriesInfoP.length) {
    const infoText = seriesInfoP.html() || '';
    console.log('Processing info text:', infoText.substring(0, 200));
    
    // Extract IMDb rating and URL
    const imdbLink = seriesInfoP.find('a[href*="imdb.com"]');
    if (imdbLink.length) {
      seriesInfo.imdbUrl = imdbLink.attr('href');
      seriesInfo.imdbRating = imdbLink.text().replace('👉 IMDb Rating:-', '').trim();
    }
    
    // Extract other info using regex
    const extractInfo = (label: string) => {
      const regex = new RegExp(`<strong>${label}:</strong>\\s*([^<]*(?:<[^>]+>[^<]*)*?)(?:<br|$)`, 'i');
      const match = infoText.match(regex);
      const result = match ? match[1].replace(/<[^>]+>/g, '').trim() : undefined;
      console.log(`Extracted ${label}:`, result);
      return result;
    };
    
    // Extract series-specific info
    seriesInfo.seriesName = extractInfo('Series Name');
    seriesInfo.season = extractInfo('Season');
    seriesInfo.episode = extractInfo('Episode');
    seriesInfo.episodeSize = extractInfo('Episode Size');
    seriesInfo.completeZip = extractInfo('Complete Zip');
    seriesInfo.releasedYear = extractInfo('Released Year');
    
    // Extract movie-specific info
    seriesInfo.movieName = extractInfo('Movie Name');
    seriesInfo.releaseYear = extractInfo('Release Year');
    seriesInfo.size = extractInfo('Size');
    
    // Extract common info
    seriesInfo.language = extractInfo('Language');
    seriesInfo.subtitle = extractInfo('Subtitle');
    seriesInfo.quality = extractInfo('Quality');
    seriesInfo.format = extractInfo('Format');
    
    // Determine content type
    if (seriesInfo.seriesName || seriesInfo.season || seriesInfo.episode) {
      seriesInfo.contentType = 'series';
    } else if (seriesInfo.movieName) {
      seriesInfo.contentType = 'movie';
    }
  }
  
  return { seriesInfo, headerText, debugContent };
}

function extractSynopsis(html: string): string | undefined {
  const $ = cheerio.load(html);
  
  // Find the synopsis section
  const synopsisHeader = $('h3').filter((i, el) => {
    return $(el).text().includes('SYNOPSIS/PLOT');
  });
  
  if (synopsisHeader.length) {
    const synopsisP = synopsisHeader.next('p');
    if (synopsisP.length) {
      return synopsisP.text().trim();
    }
  }
  
  return undefined;
}

async function scrapeVegaMovieDetails(url: string): Promise<VegaMovieDetails> {
  try {
    console.log(`Fetching VegaMovies details from: ${url}`);
    
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
      throw new Error(`Failed to fetch VegaMovies details: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract series info
    const { seriesInfo, headerText, debugContent } = extractSeriesInfo(html);
    console.log('Extracted series info:', seriesInfo);
    
    // Extract synopsis
    const synopsis = extractSynopsis(html);
    console.log('Extracted synopsis:', synopsis);
    
    let seasonQualities: SeasonQuality[] = [];
    let movieQualities: MovieQuality[] = [];
    
    // Extract downloads based on content type
    if (seriesInfo.contentType === 'series') {
      seasonQualities = extractSeasonHeaders(html);
      console.log(`Found ${seasonQualities.length} season qualities with V-Cloud links:`, seasonQualities);
    } else if (seriesInfo.contentType === 'movie' || seriesInfo.movieName) {
      movieQualities = extractMovieDownloads(html);
      console.log(`Found ${movieQualities.length} movie qualities with download links:`, movieQualities);
    } else {
      // If content type is unclear, try both
      seasonQualities = extractSeasonHeaders(html);
      movieQualities = extractMovieDownloads(html);
      console.log(`Content type unclear - found ${seasonQualities.length} seasons and ${movieQualities.length} movie qualities`);
    }
    
    return {
      seriesInfo,
      synopsis,
      seasonQualities,
      movieQualities,
      seriesInfoHeaderText: headerText,
      debugH3Content: debugContent,
      sourceUrl: url
    };

  } catch (error) {
    console.error('Error scraping VegaMovies details:', error);
    throw error;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<VegaMovieDetailsResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<VegaMovieDetailsResponse>;
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json<VegaMovieDetailsResponse>(
        { 
          success: false, 
          error: 'URL parameter is required',
          message: 'Please provide a VegaMovies URL using ?url=<vegamovies_url>'
        },
        { status: 400 }
      );
    }

    console.log('Processing VegaMovies details request:', { url });

    const movieDetails = await scrapeVegaMovieDetails(url);

    return NextResponse.json<VegaMovieDetailsResponse>({
      success: true,
      data: movieDetails,
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('VegaMovies details API error:', error);
    
    return NextResponse.json<VegaMovieDetailsResponse>(
      { 
        success: false, 
        error: 'Failed to fetch details from VegaMovies',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
