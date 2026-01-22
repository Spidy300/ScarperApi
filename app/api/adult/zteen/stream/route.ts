import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateProviderAccess, createProviderErrorResponse } from '@/lib/provider-validator';

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

    // Extract video source URL
    const videoSource = $('video source').attr('src') || '';
    const videoPoster = $('video').attr('poster') || '';
    const videoId = $('video').attr('id') || '';

    if (!videoSource) {
      return NextResponse.json(
        { success: false, error: 'Video source not found' },
        { status: 404 }
      );
    }

    // Extract related videos
    const relatedVideos: Array<{
      title: string;
      url: string;
      image: string;
    }> = [];

    $('#list_videos_related_videos_items .thumb.item').each((_, element) => {
      const $thumb = $(element);
      const $link = $thumb.find('a');
      
      const url = $link.attr('href') || '';
      const title = $link.find('.thumb-desc').text().trim();
      
      const $img = $link.find('img.img');
      const image = $img.attr('data-original') || $img.attr('src') || '';

      if (title && url && image) {
        relatedVideos.push({
          title,
          url,
          image,
        });
      }
    });

    return NextResponse.json({
      success: true,
      videoId: videoId,
      videoSource: videoSource,
      videoPoster: videoPoster,
      relatedVideos: relatedVideos,
    });

  } catch (error) {
    console.error('Error processing zteen stream:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process stream data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
