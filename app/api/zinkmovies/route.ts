import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/baseurl";
import * as cheerio from "cheerio";

interface Content {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  rating: string;
  quality: string;
  language: string;
  year: string;
  type: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("s") || "";
    const page = searchParams.get("page") || "1";

    const baseUrl = await getBaseUrl("zinkmovies");

    const searchUrl = query 
      ? `${baseUrl}?s=${encodeURIComponent(query)}`
      : page !== "1" 
        ? `${baseUrl}/page/${page}`
        : baseUrl;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data from ZinkMovies" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const sliderContent: Content[] = [];
    const trendingContent: Content[] = [];
    const moviesContent: Content[] = [];
    const tvShowsContent: Content[] = [];

    $('#slider-movies-tvshows article.item').each((_, element) => {
      const $article = $(element);
      const id = $article.attr('id')?.replace('post-', '') || '';
      const $link = $article.find('a').first();
      const url = $link.attr('href') || '';
      const title = $article.find('.title').text().trim();
      const imageUrl = $article.find('img').attr('src') || 
                       $article.find('img').attr('data-lazy-src') || '';
      const year = $article.find('.data span').text().trim();

      if (title && url) {
        sliderContent.push({
          id,
          title,
          url,
          imageUrl,
          rating: '',
          quality: '',
          language: '',
          year,
          type: url.includes('/tvshows/') ? 'tvshow' : 'movie',
        });
      }
    });

    $('#featured-titles article.item').each((_, element) => {
      const $article = $(element);
      const id = $article.attr('id')?.replace('post-featured-', '') || '';
      const $link = $article.find('.poster a, .data a').first();
      const url = $link.attr('href') || '';
      const title = $article.find('h3 a').text().trim();
      const imageUrl = $article.find('.poster img').attr('src') || 
                       $article.find('.poster img').attr('data-lazy-src') || '';
      const rating = $article.find('.rating').text().trim();
      const quality = $article.find('.featu').text().trim();
      const language = $article.find('.epdetails').text().trim();
      const year = $article.find('.data span').text().trim();
      const type = $article.hasClass('movies') ? 'movie' : 'tvshow';

      if (title && url) {
        trendingContent.push({
          id,
          title,
          url,
          imageUrl,
          rating,
          quality,
          language,
          year,
          type,
        });
      }
    });

    $('article.item.movies').each((_, element) => {
      const $article = $(element);
      const id = $article.attr('id')?.replace('post-', '') || '';
      const $link = $article.find('a').first();
      const url = $link.attr('href') || '';
      const title = $article.find('h3 a').text().trim();
      const imageUrl = $article.find('.poster img').attr('src') || 
                       $article.find('.poster img').attr('data-lazy-src') || '';
      const rating = $article.find('.rating').text().trim();
      const quality = $article.find('.quality, .mepo .quality').text().trim();
      const language = $article.find('.epdetails').text().trim();
      const year = $article.find('.data span').text().trim();

      if (title && url && !trendingContent.some(item => item.id === id)) {
        moviesContent.push({
          id,
          title,
          url,
          imageUrl,
          rating,
          quality,
          language,
          year,
          type: 'movie',
        });
      }
    });

    $('article.item.tvshows').each((_, element) => {
      const $article = $(element);
      const id = $article.attr('id')?.replace('post-', '') || '';
      const $link = $article.find('a').first();
      const url = $link.attr('href') || '';
      const title = $article.find('h3 a').text().trim();
      const imageUrl = $article.find('.poster img').attr('src') || 
                       $article.find('.poster img').attr('data-lazy-src') || '';
      const rating = $article.find('.rating').text().trim();
      const quality = $article.find('.quality, .mepo .quality').text().trim();
      const language = $article.find('.epdetails').text().trim();
      const year = $article.find('.data span').text().trim();

      if (title && url && !trendingContent.some(item => item.id === id)) {
        tvShowsContent.push({
          id,
          title,
          url,
          imageUrl,
          rating,
          quality,
          language,
          year,
          type: 'tvshow',
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        slider: sliderContent,
        trending: trendingContent,
        movies: moviesContent,
        tvShows: tvShowsContent,
      },
      query,
      baseUrl,
    });

  } catch (error) {
    console.error("Error in ZinkMovies API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
