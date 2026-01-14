import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/baseurl";
import * as cheerio from "cheerio";

interface Movie {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  videoLabel: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("s") || "";
    const page = searchParams.get("page") || "1";

    // Get base URL for movies4u
    const baseUrl = await getBaseUrl("movies4u");

    // Construct search URL
    const searchUrl = query 
      ? `${baseUrl}?s=${encodeURIComponent(query)}&paged=${page}`
      : `${baseUrl}/page/${page}`;

    // Fetch the page
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data from Movies4u" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse movie articles
    const movies: Movie[] = [];
    
    $('article.post, article[class*="post-"]').each((_, element) => {
      const $article = $(element);
      
      // Extract movie ID from either id attribute or class
      let id = $article.attr('id')?.replace('post-', '') || '';
      if (!id) {
        const classMatch = $article.attr('class')?.match(/post-(\d+)/);
        id = classMatch ? classMatch[1] : '';
      }
      
      // Extract title and URL - check both h2 and h3 for entry-title
      const $titleLink = $article.find('h2.entry-title a, h3.entry-title a');
      const title = $titleLink.text().trim();
      const url = $titleLink.attr('href') || '';
      
      // Extract image URL - handle both direct figure img and nested structure
      let imageUrl = $article.find('figure img').attr('src') || '';
      if (!imageUrl) {
        imageUrl = $article.find('.post-thumbnail img').attr('src') || '';
      }
      
      // Extract video label (quality)
      const videoLabel = $article.find('.video-label').text().trim();
      
      if (title && url) {
        movies.push({
          id,
          title,
          url,
          imageUrl,
          videoLabel,
        });
      }
    });

    // Extract pagination info
    const hasNextPage = $('.pagination .next.page-numbers').length > 0;
    const currentPage = $('.pagination .current').text().trim();
    const lastPage = $('.pagination .page-numbers')
      .not('.next, .prev, .dots, .current')
      .last()
      .text()
      .trim();

    return NextResponse.json({
      success: true,
      data: {
        movies,
        pagination: {
          currentPage: parseInt(currentPage) || 1,
          lastPage: parseInt(lastPage) || 1,
          hasNextPage,
        },
        query,
        baseUrl,
      },
    });

  } catch (error) {
    console.error("Error in Movies4u API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
