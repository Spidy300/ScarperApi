import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface DownloadLink {
  quality: string;
  badge?: string;
  fileSize?: string;
  url: string;
}

interface MovieInfo {
  imdbRating?: string;
  movieName?: string;
  director?: string;
  starring?: string;
  genres?: string;
  runningTime?: string;
  writer?: string;
  releaseDate?: string;
  ott?: string;
  quality?: string;
  language?: string;
  subtitles?: string;
  format?: string;
}

interface KMMoviesDetailsResponse {
  success: boolean;
  data?: {
    title: string;
    releaseDate?: string;
    categories: string[];
    posterImage?: string;
    screenshots: string[];
    storyline?: string;
    movieInfo: MovieInfo;
    downloadLinks: DownloadLink[];
  };
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL parameter is required",
        } as KMMoviesDetailsResponse,
        { status: 400 }
      );
    }

    // Fetch the movie details page
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
      throw new Error(`Failed to fetch movie details: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $("h1").first().text().trim();

    // Extract release date
    const releaseDate = $(".filter-button .calendar-icon")
      .parent()
      .find("span")
      .text()
      .trim();

    // Extract categories/tags
    const categories: string[] = [];
    $(".filter-button span").each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && !text.match(/\d{1,2}\s+\w+\s+\d{4}/)) {
        categories.push(text);
      }
    });

    // Extract poster image
    const posterImage = $(".post-thumbnail img").attr("src") || "";

    // Extract screenshots from slider
    const screenshots: string[] = [];
    const sliderData = $(".wp-slider-container").attr("data-images");
    if (sliderData) {
      try {
        const images = JSON.parse(sliderData);
        screenshots.push(...images);
      } catch (e) {
        console.error("Failed to parse screenshots:", e);
      }
    }

    // Extract storyline
    const storyline = $(".mip-movie-info p").first().text().trim();

    // Extract movie info
    const movieInfo: MovieInfo = {};
    const movieInfoText = $(".mip-movie-info p")
      .eq(1)
      .html()
      ?.replace(/<br\s*\/?>/gi, "\n") || "";
    
    const infoLines = movieInfoText.split("\n");
    infoLines.forEach((line) => {
      const text = cheerio.load(line).root().text();
      if (text.includes("IMDb Rating:")) {
        movieInfo.imdbRating = text.split("IMDb Rating:")[1]?.trim();
      } else if (text.includes("Movie Name:")) {
        movieInfo.movieName = text.split("Movie Name:")[1]?.trim();
      } else if (text.includes("Directed By:")) {
        movieInfo.director = text.split("Directed By:")[1]?.trim();
      } else if (text.includes("Starring:")) {
        movieInfo.starring = text.split("Starring:")[1]?.trim();
      } else if (text.includes("Movie Genres:")) {
        movieInfo.genres = text.split("Movie Genres:")[1]?.trim();
      } else if (text.includes("Running Time:")) {
        movieInfo.runningTime = text.split("Running Time:")[1]?.trim();
      } else if (text.includes("Writer:")) {
        movieInfo.writer = text.split("Writer:")[1]?.trim();
      } else if (text.includes("Release Date:")) {
        movieInfo.releaseDate = text.split("Release Date:")[1]?.trim();
      } else if (text.includes("OTT:")) {
        movieInfo.ott = text.split("OTT:")[1]?.trim();
      } else if (text.includes("Quality:")) {
        movieInfo.quality = text.split("Quality:")[1]?.trim();
      } else if (text.includes("Language:")) {
        movieInfo.language = text.split("Language:")[1]?.trim();
      } else if (text.includes("Subtitles:")) {
        movieInfo.subtitles = text.split("Subtitles:")[1]?.trim();
      } else if (text.includes("Format:")) {
        movieInfo.format = text.split("Format:")[1]?.trim();
      }
    });

    // Extract download links
    const downloadLinks: DownloadLink[] = [];
    $(".modern-option-card").each((_, elem) => {
      const card = $(elem);
      const badges = card.find(".modern-badge");
      const quality = badges.first().text().trim();
      const badge = badges.length > 1 ? badges.eq(1).text().trim() : undefined;
      const fileSize = card.find(".modern-file-size span").first().text().trim();
      const downloadUrl = card.find(".modern-download-button").attr("href") || "";

      if (quality && downloadUrl) {
        downloadLinks.push({
          quality,
          badge,
          fileSize: fileSize || undefined,
          url: downloadUrl,
        });
      }
    });

    const responseData: KMMoviesDetailsResponse = {
      success: true,
      data: {
        title,
        releaseDate: releaseDate || undefined,
        categories,
        posterImage: posterImage || undefined,
        screenshots,
        storyline: storyline || undefined,
        movieInfo,
        downloadLinks,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching KMMovies details:", error);

    const errorResponse: KMMoviesDetailsResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch movie details",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
