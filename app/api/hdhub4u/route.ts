import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/baseurl";
import * as cheerio from "cheerio";

interface Content {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";

    const baseUrl = await getBaseUrl("hdhub");

    const fetchUrl = page !== "1" 
      ? `${baseUrl}/page/${page}` 
      : baseUrl;

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data from HDHub4u" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const recentMovies: Content[] = [];

    $('ul.recent-movies li.thumb').each((_, element) => {
      const $li = $(element);
      const $link = $li.find('a').first();
      const url = $link.attr('href') || '';
      const $img = $li.find('img');
      const imageUrl = $img.attr('src') || '';
      const title = $img.attr('alt') || $img.attr('title') || '';

      // Extract a simple ID from the URL
      const id = url.split('/').filter(Boolean).pop() || '';

      if (title && url) {
        recentMovies.push({
          id,
          title,
          url,
          imageUrl,
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        recentMovies,
        page: parseInt(page),
        totalItems: recentMovies.length,
      },
    });

  } catch (error) {
    console.error("Error in HDHub4u API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
