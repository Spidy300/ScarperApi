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
    const page = searchParams.get("page") || "1";

    const baseUrl = await getBaseUrl("Moviesmod");
    const fetchUrl = page === "1" ? baseUrl : `${baseUrl}page/${page}/`;

    const response = await fetch(fetchUrl, {
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
        { error: "Failed to fetch data from Moviesmod" },
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

    // Extract pagination info
    const currentPage = parseInt(page);
    const hasNextPage = $(".pagination .next.page-numbers").length > 0;
    const totalPages = $(".pagination .page-numbers")
      .not(".dots, .next, .prev")
      .last()
      .text()
      .trim()
      .replace(/,/g, "");

    return NextResponse.json({
      success: true,
      page: currentPage,
      totalPages: totalPages ? parseInt(totalPages) : currentPage,
      hasNextPage,
      totalResults: movies.length,
      results: movies,
    });
  } catch (error) {
    console.error("Moviesmod API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch movies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
