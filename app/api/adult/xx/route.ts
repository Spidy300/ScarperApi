import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { xx } from '@/app/url/baseurl';
import { validateProviderAccess, createProviderErrorResponse } from '@/lib/provider-validator';

export async function GET(request: NextRequest) {
  const validation = await validateProviderAccess(request, "Adult");
  if (!validation.valid) {
    return createProviderErrorResponse(validation.error || "Unauthorized");
  }

  try {
    const response = await fetch(xx, {
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
      views: string;
      comments: string;
      likes: string;
      isHd: boolean;
    }> = [];

    $('.production-block__list li').each((_, element) => {
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
        
        if (idx === 0) views = value; // First parameter is views
        if (idx === 1) comments = value; // Second parameter is comments
        if (idx === 2) likes = value; // Third parameter is likes
      });
      
      const isHd = $li.find('.hd').length > 0;

      if (title && url && image) {
        videos.push({
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
      totalVideos: videos.length,
      videos: videos,
    });

  } catch (error) {
    console.error('Error processing xx page:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process page',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
