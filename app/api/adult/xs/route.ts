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
    const page = searchParams.get('page') || '1';

    // Construct URL with page parameter
    const url = page === '1' 
      ? 'https://xxxstreams.org/' 
      : `https://xxxstreams.org/page/${page}/`;

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
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

    // Extract articles
    const articles: Array<{
      title: string;
      url: string;
      image: string;
      categories: string[];
      isSticky?: boolean;
    }> = [];

    $('article.masonry-post').each((_, element) => {
      const $article = $(element);
      
      // Extract title and URL
      const titleElement = $article.find('h2.entry-title a');
      const title = titleElement.text().trim();
      const url = titleElement.attr('href') || '';
      
      // Extract image (try entry-content first, then entry-summary)
      const image = $article.find('div.entry-content a img').attr('src') || 
                    $article.find('div.entry-summary a img').attr('src') || '';
      
      // Extract categories
      const categories: string[] = [];
      $article.find('footer.entry-meta .cat-links a').each((_, catEl) => {
        const category = $(catEl).text().trim();
        if (category) {
          categories.push(category);
        }
      });

      // Check if sticky post
      const isSticky = $article.hasClass('sticky');

      if (title && url) {
        articles.push({
          title,
          url,
          image,
          categories,
          isSticky: isSticky || undefined,
        });
      }
    });

    return NextResponse.json({
      success: true,
      page: parseInt(page),
      totalArticles: articles.length,
      articles: articles,
    });

  } catch (error) {
    console.error('Error processing page:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process page',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
