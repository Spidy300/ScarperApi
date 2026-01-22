import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { xx } from '@/app/url/baseurl';
import { validateProviderAccess, createProviderErrorResponse } from '@/lib/provider-validator';

async function followRedirects(url: string): Promise<string> {
  try {
    const redirectChain: string[] = [url];
    let currentUrl = url;
    let redirectCount = 0;
    const maxRedirects = 10; // Prevent infinite loops

    while (redirectCount < maxRedirects) {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      // Check if it's a redirect (3xx status codes)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;

        // Handle relative URLs
        const nextUrl = new URL(location, currentUrl).href;
        redirectChain.push(nextUrl);
        currentUrl = nextUrl;
        redirectCount++;
      } else {
        // Not a redirect, we've reached the final URL
        break;
      }
    }

    // Log the full redirect chain
    console.log(`[XX Stream] Redirect chain (${redirectChain.length} steps):`);
    redirectChain.forEach((url, index) => {
      if (index === 0) {
        console.log(`  ${index + 1}. [START] ${url}`);
      } else if (index === redirectChain.length - 1) {
        console.log(`  ${index + 1}. [FINAL PLAYABLE URL] ${url}`);
      } else {
        console.log(`  ${index + 1}. [REDIRECT] ${url}`);
      }
    });

    return currentUrl;
  } catch (error) {
    console.error(`[XX Stream] Error following redirects for ${url}:`, error);
    return url; // Return original URL if redirect fails
  }
}

export async function GET(request: NextRequest) {
  const validation = await validateProviderAccess(request, "Adult");
  if (!validation.valid) {
    return createProviderErrorResponse(validation.error || "Unauthorized");
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Fetch the video page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = load(html);

    let videoId = '';
    let videoTitle = '';
    let videoLink = '';
    let posterImage = '';
    const videoSources: Array<{ quality: string; url: string }> = [];

    const scripts = $('script').toArray();
    for (const script of scripts) {
      const scriptContent = $(script).html() || '';
      
      if (scriptContent.includes('LoadPlayer')) {
        const vidMatch = scriptContent.match(/var vid = '(\d+)'/);
        if (vidMatch) videoId = vidMatch[1];

        const titleMatch = scriptContent.match(/var VTitle = '([^']+)'/);
        if (titleMatch) videoTitle = titleMatch[1].replace(/&hearts;/g, '♥').replace(/&starf;/g, '★');

        const linkMatch = scriptContent.match(/var VLink = '([^']+)'/);
        if (linkMatch) videoLink = linkMatch[1];

        const imageMatch = scriptContent.match(/var ImageURL = '([^']+)'/);
        if (imageMatch) posterImage = imageMatch[1];

        const fileMatch = scriptContent.match(/var file = "([^"]+)"/);
        if (fileMatch) {
          const fileString = fileMatch[1];
          const sources = fileString.split(',');
          
          sources.forEach(source => {
            const qualityMatch = source.match(/\[([^\]]+)\](.+?)(?:\s+or\s+|$)/);
            if (qualityMatch) {
              const quality = qualityMatch[1];
              let sourceUrl = qualityMatch[2].trim();
              
              const baseUrlWithoutTrailingSlash = xx.replace(/\/$/, '');
              
              if (sourceUrl.startsWith('./')) {
                sourceUrl = `${baseUrlWithoutTrailingSlash}/${sourceUrl.substring(2)}`;
              } else if (sourceUrl.startsWith('/')) {
                sourceUrl = `${baseUrlWithoutTrailingSlash}${sourceUrl}`;
              } else if (!sourceUrl.startsWith('http')) {
                sourceUrl = `${baseUrlWithoutTrailingSlash}/${sourceUrl}`;
              }
              
              videoSources.push({
                quality,
                url: sourceUrl
              });
            }
          });
        }

        break;
      }
    }

    if (!videoId || videoSources.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video information not found' },
        { status: 404 }
      );
    }

    // Follow redirects for all video sources to get final playable URLs
    console.log(`[XX Stream] Processing ${videoSources.length} video sources...`);
    const finalVideoSources = await Promise.all(
      videoSources.map(async (source) => {
        const finalUrl = await followRedirects(source.url);
        return {
          quality: source.quality,
          url: finalUrl
        };
      })
    );

    const relatedVideos: Array<{
      title: string;
      url: string;
      image: string;
      views: string;
      comments: string;
      likes: string;
      isHd: boolean;
    }> = [];

    $('#related-videos-list li, .production-block__list li').each((_, element) => {
      const $li = $(element);
      
      const $link = $li.find('.production-block__caption a.link');
      const title = $link.text().trim();
      const relativeUrl = $link.attr('href') || '';
      const url = relativeUrl ? `${xx}${relativeUrl}` : '';
      
      const $img = $li.find('.production-block__image-container img');
      const image = $img.attr('data-original') || $img.attr('data-src') || $img.attr('src') || '';
      
      const $params = $li.find('.parameters li');
      let views = '';
      let comments = '';
      let likes = '';
      
      $params.each((idx, param) => {
        const $param = $(param);
        const value = $param.find('span').text().trim();
        
        if (idx === 0) views = value;
        if (idx === 1) comments = value;
        if (idx === 2) likes = value;
      });
      
      const isHd = $li.find('.hd').length > 0;

      if (title && url && image) {
        relatedVideos.push({
          title,
          url,
          image,
          views,
          comments,
          likes,
          isHd,
        });
      }
    });

    return NextResponse.json({
      success: true,
      videoId,
      title: videoTitle,
      videoLink,
      poster: posterImage,
      sources: finalVideoSources,
      relatedVideos,
    });

  } catch (error) {
    console.error('Error processing xx stream:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process stream data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
