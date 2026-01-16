import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getBaseUrl } from "@/lib/baseurl";

interface Movie {
  id: string;
  title: string;
  url: string;
  image: string;
  imageAlt: string;
}

interface KMMoviesResponse {
  success: boolean;
  data?: {
    movies: Movie[];
    pagination?: {
      current: number;
      next: string | null;
      last: string | null;
    };
  };
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";

    // Get base URL from baseurl.ts
    const baseUrl = await getBaseUrl("KMMovies");
    const url = page === "1" ? baseUrl : `${baseUrl}/page/${page}/`;

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const movies: Movie[] = [];

    // Parse articles from the site-main section
    $("section.site-main article.post").each((_, element) => {
      const article = $(element);
      const id = article.attr("id")?.replace("post-", "") || "";
      const link = article.find("figure a.post-thumbnail");
      const url = link.attr("href") || "";
      const image = link.find("img").attr("src") || "";
      const imageAlt = link.find("img").attr("alt") || "";
      const title =
        article.find("h3.entry-title a").text().trim() || imageAlt;

      if (id && url && title) {
        movies.push({
          id,
          title,
          url,
          image,
          imageAlt,
        });
      }
    });

    // Parse pagination
    const pagination = {
      current: parseInt(page),
      next: null as string | null,
      last: null as string | null,
    };

    const nextLink = $("nav.pagination a.next").attr("href");
    if (nextLink) {
      const nextPage = nextLink.match(/\/page\/(\d+)\//);
      pagination.next = nextPage ? nextPage[1] : null;
    }

    const lastLink = $("nav.pagination a.page-numbers")
      .not(".next")
      .not(".current")
      .not(".dots")
      .last()
      .attr("href");
    if (lastLink) {
      const lastPage = lastLink.match(/\/page\/(\d+)\//);
      pagination.last = lastPage ? lastPage[1] : null;
    }

    const responseData: KMMoviesResponse = {
      success: true,
      data: {
        movies,
        pagination,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching KMMovies data:", error);

    const errorResponse: KMMoviesResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch movies data",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
