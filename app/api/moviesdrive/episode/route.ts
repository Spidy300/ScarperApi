import { NextResponse } from 'next/server';
import { load } from 'cheerio';

// Function to normalize URLs
function normalizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('//')) return 'https:' + url;
  return url;
}

async function getEpisodeDetails(url: string) {
  try {
    console.log(`Fetching episode details from: ${url}`);

    const response = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch episode details: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);
    
    // Extract main image
    const mainImage = $('img[fetchpriority="high"], .entry-content img').first().attr('src');
    
    // Extract IMDb rating
    const imdbElement = $('a[href*="imdb.com"]');
    const imdbRating = {
      url: imdbElement.attr('href'),
      text: imdbElement.text().trim()
    };
    
    // Extract storyline from h5 or other elements
    const storyline = $('h5[style*="text-align: center"]').text().trim() || 
                      $('.entry-content p').first().text().trim();
    
    // Extract episode links
    const episodes = [];
    $('h5[style*="text-align: center"] a, .entry-content h5 a').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (href && text && href.includes('mdrive.today') && !text.includes('Zip')) {
        episodes.push({
          url: href,
          quality: text
        });
      }
    });

    // Extract additional quality links that aren't in h5 tags
    $('a[href*="mdrive.today"], a[href*="archives"]').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      // Only include if it looks like a download link, isn't a Zip file, and wasn't already included
      if (href && 
          text && 
          (text.includes('p') || text.includes('MB') || text.includes('GB')) &&
          !text.includes('Zip') &&
          !episodes.some(ep => ep.url === href)) {
        episodes.push({
          url: href,
          quality: text
        });
      }
    });

    return {
      mainImage: normalizeUrl(mainImage),
      imdbRating,
      storyline,
      episodes
    };
  } catch (error) {
    console.error('Error fetching episode details:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL parameter is required'
      }, { status: 400 });
    }

    // Make sure the URL is from moviesdrive.solutions
    if (!url.includes('moviesdrive.solutions')) {
      return NextResponse.json({
        success: false,
        error: 'Only MoviesDrive URLs are supported'
      }, { status: 400 });
    }

    const episodeDetails = await getEpisodeDetails(url);

    return NextResponse.json({
      success: true,
      data: episodeDetails
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch episode details'
    }, { status: 500 });
  }
}
