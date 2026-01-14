import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/baseurl";
import * as cheerio from "cheerio";

interface Movie {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  quality: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";

    const baseUrl = await getBaseUrl("zeefliz");
    const fetchUrl = page === "1" ? baseUrl : `${baseUrl}/page/${page}`;

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data from Zeefliz" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const movies: Movie[] = [];

    $('article.post').each((_, element) => {
      const $article = $(element);
      const id = $article.attr('id')?.replace('post-', '') || '';
      const $link = $article.find('a.post-thumbnail').first();
      const url = $link.attr('href') || '';
      const imageUrl = $article.find('img').attr('bv-data-src') || 
                       $article.find('img').attr('src') || '';
      const quality = $article.find('.movie-label').text().trim();
      const title = $article.find('h3.entry-title a').text().trim();

      if (title && url) {
        movies.push({
          id,
          title,
          url,
          imageUrl,
          quality,
        });
      }
    });

    let hasNextPage = false;
    let nextPage = null;
    const nextLink = $('.navigation.pagination .next.page-numbers').attr('href');
    if (nextLink) {
      hasNextPage = true;
      const pageMatch = nextLink.match(/\/page\/(\d+)\//);
      nextPage = pageMatch ? pageMatch[1] : null;
    }

    return NextResponse.json({
      success: true,
      data: movies,
      pagination: {
        currentPage: page,
        hasNextPage,
        nextPage,
      },
      baseUrl,
    });

  } catch (error) {
    console.error("Error in Zeefliz API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
