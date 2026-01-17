import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/baseurl";
import * as cheerio from "cheerio";

interface Movie {
  title: string;
  url: string;
  image: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const baseUrl = await getBaseUrl("Moviesmod");
    const searchUrl = `${baseUrl}search/${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": baseUrl,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to search on Moviesmod" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const movies: Movie[] = [];

    $("article.latestPost.excerpt").each((_, element) => {
      const $article = $(element);
      
      const url = $article.find("a.post-image").attr("href") || "";
      const title = $article.find(".title.front-view-title a").text().trim();
      const image = $article.find(".featured-thumbnail img").attr("src") || "";

      if (title && url) {
        movies.push({
          title,
          url,
          image,
        });
      }
    });

    return NextResponse.json({
      success: true,
      query,
      totalResults: movies.length,
      results: movies,
    });
  } catch (error) {
    console.error("Moviesmod Search API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to search movies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
