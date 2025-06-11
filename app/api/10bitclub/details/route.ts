import { NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

// Function to normalize image URLs
function normalizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return 'https://10bitclub.xyz' + url;
  return url;
}

// Function to extract file size from text
function extractFileSize(text: string): string | null {
  const sizeMatch = text.match(/(\d+(?:\.\d+)?\s*(?:MB|GB))/i);
  return sizeMatch ? sizeMatch[1] : null;
}

// Function to extract quality from text
function extractQuality(text: string): string | null {
  const qualityMatch = text.match(/(720p|1080p|480p|2160p|4K)/i);
  return qualityMatch ? qualityMatch[1] : null;
}

// Function to extract language from text
function extractLanguage(text: string): string | null {
  const langMatch = text.match(/(Tamil|Hindi|English|Malayalam|Telugu|Kannada|Multi|TAM-HIN|HIN-KAN|MAL-TEL)/i);
  return langMatch ? langMatch[1] : null;
}

// Main function to fetch and parse movie details
async function scrape10BitClubDetails(movieUrl: string) {
  try {
    console.log(`Fetching movie details from: ${movieUrl}`);

    // Fetch the page content
    const response = await fetch(movieUrl, {
      cache: 'no-cache',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://10bitclub.xyz/'
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch movie details: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extract basic movie information from .sheader
    const posterImg = $('.sheader .poster img').attr('src');
    const title = $('.sheader .data h1').text().trim();
    
    // Extract movie metadata from .extra
    const dateElement = $('.sheader .data .extra .date').text().trim();
    const country = $('.sheader .data .extra .country').text().trim();
    const runtime = $('.sheader .data .extra .runtime').text().trim();
    const rating = $('.sheader .data .extra').last().text().trim();

    // Extract synopsis from #info .sbox
    const synopsisDiv = $('#info.sbox .wp-content');
    let synopsis = '';
    
    // Get only the first paragraph(s) before download links
    synopsisDiv.find('p').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && !text.includes('MB') && !text.includes('GB') && !text.toLowerCase().includes('hubcloud')) {
        synopsis += text + '\n';
      }
    });

    // Extract only HubCloud download links
    const hubCloudSections = [];
    
    // Look for download sections in the synopsis area - focus on HubCloud only
    synopsisDiv.find('h3').each((_, elem) => {
      const $section = $(elem);
      const sectionText = $section.text();
      
      // Skip if this doesn't look like a download section
      if (!sectionText.includes('MB') && !sectionText.includes('GB')) return;
      
      const quality = extractQuality(sectionText);
      const fileSize = extractFileSize(sectionText);
      const language = extractLanguage(sectionText);
      
      // Extract only HubCloud links from the next element
      const hubCloudLinks = [];
      const nextElement = $section.next('p');
      
      nextElement.find('a').each((_, linkElem) => {
        const $link = $(linkElem);
        const linkText = $link.text().trim();
        const linkUrl = $link.attr('href');
        
        // Only process HubCloud links
        if (linkUrl && linkText && (linkText.toLowerCase().includes('hubcloud') || linkUrl.includes('hubcloud'))) {
          hubCloudLinks.push({
            url: linkUrl,
            text: linkText
          });
        }
      });
      
      if (hubCloudLinks.length > 0) {
        hubCloudSections.push({
          title: sectionText.trim(),
          quality: quality || 'Unknown',
          fileSize: fileSize || 'Unknown',
          language: language || 'Unknown',
          hubCloudLinks
        });
      }
    });

    // Also check for standalone HubCloud links in paragraphs
    synopsisDiv.find('p').each((_, elem) => {
      const $para = $(elem);
      const paraText = $para.text();
      
      // Only process paragraphs that contain HubCloud references
      if (!paraText.toLowerCase().includes('hubcloud')) return;
      
      const hubCloudLinks = [];
      $para.find('a').each((_, linkElem) => {
        const $link = $(linkElem);
        const linkText = $link.text().trim();
        const linkUrl = $link.attr('href');
        
        // Only process HubCloud links
        if (linkUrl && linkText && (linkText.toLowerCase().includes('hubcloud') || linkUrl.includes('hubcloud'))) {
          hubCloudLinks.push({
            url: linkUrl,
            text: linkText
          });
        }
      });
      
      // If we found HubCloud links but no corresponding h3, create a generic section
      if (hubCloudLinks.length > 0) {
        const quality = extractQuality(paraText);
        const fileSize = extractFileSize(paraText);
        const language = extractLanguage(paraText);
        
        hubCloudSections.push({
          title: paraText.substring(0, 100) + '...',
          quality: quality || 'Unknown',
          fileSize: fileSize || 'Unknown',
          language: language || 'Unknown',
          hubCloudLinks
        });
      }
    });

    // Extract tags if available
    const tags = [];
    $('.wp-tags li a').each((_, elem) => {
      const tag = $(elem).text().trim();
      if (tag) tags.push(tag);
    });

    // Count total HubCloud links
    const totalHubCloudLinks = hubCloudSections.reduce((acc, section) => {
      return acc + section.hubCloudLinks.length;
    }, 0);

    const movieDetails = {
      title: title || 'Unknown Title',
      posterImage: normalizeImageUrl(posterImg),
      releaseDate: dateElement || null,
      country: country || null,
      runtime: runtime || null,
      rating: rating || null,
      synopsis: synopsis.trim() || 'No synopsis available',
      hubCloudSections,
      tags,
      totalHubCloudLinks,
      downloadSectionsCount: hubCloudSections.length
    };

    console.log(`Successfully parsed movie details for: ${title}`);
    console.log(`Found ${hubCloudSections.length} sections with ${totalHubCloudLinks} HubCloud links`);
    
    return movieDetails;
  } catch (error) {
    console.error('Error scraping 10BitClub movie details:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    // Validate API key first
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      console.log('API key validation failed:', authResult.error);
      return createUnauthorizedResponse(authResult.error || 'Invalid API key');
    }

    console.log('API key validated successfully for 10BitClub details request');

    const { searchParams } = new URL(request.url);
    const movieUrl = searchParams.get('url');

    if (!movieUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: url',
        example: '/api/10bitclub/details?url=https://10bitclub.xyz/movie-name/'
      }, {
        status: 400
      });
    }

    // Validate URL format
    if (!movieUrl.includes('10bitclub.xyz')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL. Must be a 10bitclub.xyz movie page URL',
        example: '/api/10bitclub/details?url=https://10bitclub.xyz/movie-name/'
      }, {
        status: 400
      });
    }

    try {
      const movieDetails = await scrape10BitClubDetails(movieUrl);

      return NextResponse.json({
        success: true,
        data: movieDetails,
        sourceUrl: movieUrl,
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed - 1) : 0
      });
    } catch (scrapeError) {
      console.error('10BitClub details scraping error:', scrapeError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch movie details from 10BitClub',
        details: scrapeError instanceof Error ? scrapeError.message : 'Unknown scraping error'
      }, {
        status: 500
      });
    }
  } catch (error) {
    console.error('10BitClub details API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, {
      status: 500
    });
  }
}
