import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { sb } from '@/app/url/baseurl';
import { validateProviderAccess, createProviderErrorResponse } from '@/lib/provider-validator';
import { fetchWithScraperApi } from '@/lib/scraper-api';

export async function GET(request: NextRequest) {
  const validation = await validateProviderAccess(request, "Adult");
  if (!validation.valid) {
    return createProviderErrorResponse(validation.error || "Unauthorized");
  }

  try {
    const html = await fetchWithScraperApi(sb);
    const $ = load(html);

    const videos: Array<{
      id: string;
      title: string;
      url: string;
      thumbnail: string;
      duration: string;
      views: string;
      rating: string;
      channel: string;
      channelUrl: string;
      isChannelBadge: boolean;
    }> = [];

    $('.js-video-item[data-testid="video-item"]').each((_, element) => {
      const $item = $(element);
      
      const id = $item.attr('data-id') || '';
      
      const $link = $item.find('a[data-testid="recommended-video"]');
      const url = $link.attr('href') || '';
      const fullUrl = url ? `${sb.replace(/\/$/, '')}${url}` : '';
      
      const $img = $link.find('picture img');
      const thumbnail = $img.attr('src') || '';
      const title = $img.attr('alt') || '';
      
      const duration = $link.find('[data-testid="video-item-length"]').text().trim();
      
      const $videoInfo = $item.find('[data-testid="video-info-with-badge"]');
      
      const views = $videoInfo.find('[data-testid="views"] span:last-child').text().trim();
      const rating = $videoInfo.find('[data-testid="rates"] span:last-child').text().trim();
      
      const $channelLink = $videoInfo.find('[data-testid="title"] a');
      const channel = $channelLink.find('span').text().trim();
      const channelUrl = $channelLink.attr('href') || '';
      const fullChannelUrl = channelUrl ? `${sb.replace(/\/$/, '')}${channelUrl}` : '';
      
      const isChannelBadge = $videoInfo.find('[data-badge="channel"]').length > 0;

      if (id && title && fullUrl) {
        videos.push({
          id,
          title,
          url: fullUrl,
          thumbnail,
          duration,
          views,
          rating,
          channel,
          channelUrl: fullChannelUrl,
          isChannelBadge,
        });
      }
    });

    return NextResponse.json({
      success: true,
      totalVideos: videos.length,
      videos: videos,
    });

  } catch (error) {
    console.error('Error processing SpankBang page:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process page',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
