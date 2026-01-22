import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { zteen } from '@/app/url/baseurl';
import { validateProviderAccess, createProviderErrorResponse } from '@/lib/provider-validator';

export async function GET(request: NextRequest) {
  const validation = await validateProviderAccess(request, "Adult");
  if (!validation.valid) {
    return createProviderErrorResponse(validation.error || "Unauthorized");
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';

    // Construct URL with page parameter
    const url = page === '1' 
      ? zteen 
      : `${zteen}page/${page}/`;

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = load(html);
 
    const videos: Array<{
      title: string;
      url: string;
      image: string;
    }> = [];

    $('.thumb.item').each((_, element) => {
      const $thumb = $(element);
      const $link = $thumb.find('a');
      
      const url = $link.attr('href') || '';
      const title = $link.find('.thumb-desc').text().trim();
      
      const $img = $link.find('img.img');
      const image = $img.attr('data-original') || $img.attr('src') || '';

      if (title && url && image) {
        videos.push({
          title,
          url,
          image,
        });
      }
    });

    return NextResponse.json({
      success: true,
      page: parseInt(page),
      totalVideos: videos.length,
      videos: videos,
    });

  } catch (error) {
    console.error('Error processing zteen page:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process page',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
