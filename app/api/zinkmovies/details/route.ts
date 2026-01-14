import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface DownloadLink {
  quality: string;
  url: string;
}

interface MovieDetails {
  languages: string;
  downloadLinks: DownloadLink[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch movie details" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const languages = $('.lgtagmessage p').text().replace(/Languages:\s*/gi, '').replace(/↓/g, '').trim();

    const downloadLinks: DownloadLink[] = [];
    $('.movie-button-container a').each((_, element) => {
      const $link = $(element);
      const linkUrl = $link.attr('href') || '';
      const quality = $link.find('span').text().trim();
      
      if (linkUrl && quality) {
        downloadLinks.push({
          quality,
          url: linkUrl,
        });
      }
    });

    const movieDetails: MovieDetails = {
      languages,
      downloadLinks,
    };

    return NextResponse.json({
      success: true,
      data: movieDetails,
    });

  } catch (error) {
    console.error("Error in ZinkMovies Details API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
