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
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Construct search URL
    const searchUrl = `https://xxxstreams.org/?s=${encodeURIComponent(query)}`;

    // Fetch the search results page
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch search results: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = load(html);

    // Extract search results
    const results: Array<{
      title: string;
      url: string;
      image: string;
      category?: string;
    }> = [];

    $('article.masonry-post').each((_, element) => {
      const $article = $(element);
      
      // Extract title and URL
      const titleElement = $article.find('h2.entry-title a');
      const title = titleElement.text().trim();
      const url = titleElement.attr('href') || '';
      
      // Extract image
      const image = $article.find('div.entry-summary a img').attr('src') || '';
      
      // Extract category
      const category = $article.find('footer.entry-meta .cat-links a').text().trim();

      if (title && url) {
        results.push({
          title,
          url,
          image,
          category: category || undefined,
        });
      }
    });

    return NextResponse.json({
      success: true,
      query: query,
      totalResults: results.length,
      results: results,
    });

  } catch (error) {
    console.error('Error processing search:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process search results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
