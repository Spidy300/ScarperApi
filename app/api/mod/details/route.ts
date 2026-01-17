import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface DownloadLink {
  quality: string;
  format?: string;
  audio?: string;
  size?: string;
  episodeLink?: string;
  batchLink?: string;
}

interface MovieDetails {
  title: string;
  description?: string;
  image?: string;
  screenshots: string[];
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
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

    // Extract title
    const title = $(".title.front-view-title").text().trim() || 
                  $("h1.entry-title").text().trim() ||
                  $("title").text().trim();

    // Extract description
    const description = $(".GenresAndPlot__TextContainerBreakpointXL-cum89p-4 p")
      .first()
      .text()
      .trim() ||
      $(".entry-content > p").first().text().trim();

    // Extract main image
    const image = $(".featured-thumbnail img").attr("src") || 
                  $(".entry-content img").first().attr("src") || "";

    // Extract screenshots
    const screenshots: string[] = [];
    $(".entry-content img").each((_, element) => {
      const src = $(element).attr("src");
      if (src && !screenshots.includes(src)) {
        screenshots.push(src);
      }
    });

    // Extract download links
    const downloadLinks: DownloadLink[] = [];
    
    // Pattern 1: Find all h3 sections that contain quality info (Episode/Batch pattern)
    $("h3").each((_, element) => {
      const headingText = $(element).text();
      
      // Parse quality, format, audio, and size from heading
      const qualityMatch = headingText.match(/(\d+p)/i);
      const formatMatch = headingText.match(/(x264|10Bit|HEVC|H\.264)/i);
      const audioMatch = headingText.match(/\{([^}]+)\}/);
      const sizeMatch = headingText.match(/\[([^\]]+)\]/);
      
      if (qualityMatch) {
        const quality = qualityMatch[1];
        const format = formatMatch ? formatMatch[1] : undefined;
        const audio = audioMatch ? audioMatch[1] : undefined;
        const size = sizeMatch ? sizeMatch[1] : undefined;

        // Find the next paragraph with links
        const nextP = $(element).next("p");
        const episodeLink = nextP.find('a.maxbutton-episode-links').attr("href");
        const batchLink = nextP.find('a.maxbutton-batch-zip').attr("href");

        if (episodeLink || batchLink) {
          downloadLinks.push({
            quality,
            format,
            audio,
            size,
            episodeLink,
            batchLink,
          });
        }
      }
    });

    // Pattern 2: Find all h4 sections with direct download links
    $("h4").each((_, element) => {
      const headingText = $(element).text();
      
      // Parse quality, format, audio, and size from heading
      const qualityMatch = headingText.match(/(\d+p)/i);
      const formatMatch = headingText.match(/(x264|10bit|10Bit|HEVC|H\.264)/i);
      const audioMatch = headingText.match(/\(([^)]+)\)/);
      const sizeMatch = headingText.match(/\[([^\]]+)\]/);
      
      if (qualityMatch) {
        const quality = qualityMatch[1];
        const format = formatMatch ? formatMatch[1] : undefined;
        const audio = audioMatch ? audioMatch[1] : undefined;
        const size = sizeMatch ? sizeMatch[1] : undefined;

        // Find the next paragraph with download link
        const nextP = $(element).next("p");
        const downloadLink = nextP.find('a.maxbutton-download-links').attr("href");

        if (downloadLink) {
          downloadLinks.push({
            quality,
            format,
            audio,
            size,
            episodeLink: downloadLink,
          });
        }
      }
    });

    const movieDetails: MovieDetails = {
      title,
      description,
      image,
      screenshots,
      downloadLinks,
    };

    return NextResponse.json({
      success: true,
      data: movieDetails,
    });
  } catch (error) {
    console.error("Moviesmod Details API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch movie details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
