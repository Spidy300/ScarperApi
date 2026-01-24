import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { validateProviderAccess, createProviderErrorResponse } from '@/lib/provider-validator';

const BASE_URL = 'https://xvideos.place/';

export async function GET(req: NextRequest) {
  const validation = await validateProviderAccess(req, "Adult");
  if (!validation.valid) {
    return createProviderErrorResponse(validation.error || "Unauthorized");
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    const page = searchParams.get('page') || '0';
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Build search URL
    let searchUrl = `${BASE_URL}?k=${encodeURIComponent(query)}`;
    if (page !== '0') {
      searchUrl += `&p=${page}`;
    }
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch search results', status: response.status },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results: Array<{
      id: string;
      encoded_id: string;
      title: string;
      url: string;
      thumbnail: string;
      thumbnail_sfw?: string;
      duration: string;
      views: string;
      uploader: {
        name: string;
        url: string;
        verified: boolean;
      };
      quality?: string;
    }> = [];

    $('.mozaique .thumb-block').each((_, element) => {
      const $element = $(element);
      
      const id = $element.attr('data-id') || '';
      const encodedId = $element.attr('data-eid') || '';
      const isChannel = $element.attr('data-is-channel') === '1';
      
      const titleElement = $element.find('.thumb-under .title a');
      const title = titleElement.attr('title') || titleElement.text().trim();
      const url = titleElement.attr('href') || '';
      
      const imgElement = $element.find('.thumb img');
      const thumbnail = imgElement.attr('src') || imgElement.attr('data-src') || '';
      const thumbnailSfw = imgElement.attr('data-sfwthumb');
      
      const durationElement = $element.find('.thumb-under .title .duration');
      const duration = durationElement.text().trim();
      
      const uploaderElement = $element.find('.metadata .name');
      const uploaderName = uploaderElement.text().trim();
      const uploaderUrl = $element.find('.metadata a').attr('href') || '';
      
      const viewsText = $element.find('.metadata span').text();
      const viewsMatch = viewsText.match(/(\d+\.?\d*[KMk]?)\s*Views/i);
      const views = viewsMatch ? viewsMatch[1] : '0';
      
      const quality = $element.find('.video-hd-mark').text().trim();
      
      if (id && title && url) {
        results.push({
          id,
          encoded_id: encodedId,
          title,
          url: url.startsWith('http') ? url : BASE_URL.replace(/\/$/, '') + url,
          thumbnail,
          ...(thumbnailSfw && { thumbnail_sfw: thumbnailSfw }),
          duration,
          views,
          uploader: {
            name: uploaderName,
            url: uploaderUrl.startsWith('http') ? uploaderUrl : BASE_URL.replace(/\/$/, '') + uploaderUrl,
            verified: isChannel,
          },
          ...(quality && { quality }),
        });
      }
    });

    return NextResponse.json({
      success: true,
      query,
      page: parseInt(page),
      totalResults: results.length,
      results,
    });

  } catch (error) {
    console.error('Error searching xvideos:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
