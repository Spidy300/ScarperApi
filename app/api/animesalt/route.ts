import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/baseurl";
import * as cheerio from "cheerio";

interface AnimeItem {
  rank: number;
  title: string;
  url: string;
  image: string;
  type: "series" | "movie";
}

export async function GET(req: NextRequest) {
  try {
    const baseUrl = await getBaseUrl("animesalt");

    const response = await fetch(baseUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const popularSeries: AnimeItem[] = [];
    const popularMovies: AnimeItem[] = [];

    // Extract popular series from torofilm_wdgt_popular-3-aa-top
    $("#torofilm_wdgt_popular-3-all .chart-item").each((_, element) => {
      const $item = $(element);
      const rank = parseInt($item.find(".chart-number").text().trim());
      const title = $item.find(".chart-title").text().trim();
      const url = $item.find(".chart-poster").attr("href") || "";
      let image =
        $item.find(".chart-poster img").attr("data-src") ||
        $item.find(".chart-poster img").attr("src") ||
        "";
      // Filter out lazy load placeholder
      if (image.startsWith("data:image/svg+xml")) {
        image = $item.find(".chart-poster img").attr("data-src") || "";
      }
      // Add protocol if missing
      if (image.startsWith("//")) {
        image = "https:" + image;
      }

      if (title && url) {
        popularSeries.push({
          rank,
          title,
          url,
          image,
          type: "series",
        });
      }
    });

    // Extract popular movies from torofilm_wdgt_popular-5-aa-top
    $("#torofilm_wdgt_popular-5-all .chart-item").each((_, element) => {
      const $item = $(element);
      const rank = parseInt($item.find(".chart-number").text().trim());
      const title = $item.find(".chart-title").text().trim();
      const url = $item.find(".chart-poster").attr("href") || "";
      let image =
        $item.find(".chart-poster img").attr("data-src") ||
        $item.find(".chart-poster img").attr("src") ||
        "";
      // Filter out lazy load placeholder
      if (image.startsWith("data:image/svg+xml")) {
        image = $item.find(".chart-poster img").attr("data-src") || "";
      }
      // Add protocol if missing
      if (image.startsWith("//")) {
        image = "https:" + image;
      }

      if (title && url) {
        popularMovies.push({
          rank,
          title,
          url,
          image,
          type: "movie",
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        popularSeries,
        popularMovies,
      },
      total: {
        series: popularSeries.length,
        movies: popularMovies.length,
      },
    });
  } catch (error) {
    console.error("Error in animesalt API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
