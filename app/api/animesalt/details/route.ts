import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/baseurl";
import * as cheerio from "cheerio";

interface Episode {
  id: string;
  title: string;
  link: string;
  season: number;
  number: number;
  imageUrl: string;
}

interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

interface AnimeDetails {
  postId: string;
  title: string;
  image: string;
  description: string;
  type: "series" | "movie" | "unknown";
  releaseDate?: string;
  status?: string;
  genres?: string[];
  languages?: string[];
  duration?: string;
  quality?: string;
  country?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
  seasons?: Season[];
}

/**
 * Helper function to extract path from full URL
 */
function extractPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
}

/**
 * Helper function to normalize image URL
 */
function normalizeImageUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:image/svg+xml")) return "";
  if (url.startsWith("//")) return "https:" + url;
  return url;
}

/**
 * Fetch episodes for a specific season using WordPress AJAX
 */
async function fetchSeasonEpisodes(
  postId: string,
  seasonNumber: number,
  baseUrl: string
): Promise<Episode[]> {
  try {
    const formData = new URLSearchParams();
    formData.append("action", "action_select_season");
    formData.append("season", seasonNumber.toString());
    formData.append("post", postId);

    const response = await fetch(`${baseUrl}/wp-admin/admin-ajax.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      body: formData.toString(),
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch season episodes: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const episodes: Episode[] = [];

    // Parse each episode
    $("article.episodes").each((_, el) => {
      const article = $(el);
      const fullLink = article.find("a.lnk-blk").attr("href");
      const link = extractPathFromUrl(fullLink || "");
      const title = article.find("h2.entry-title").text().trim();
      const episodeNumber = parseInt(
        article.find("span.num-epi").text().trim(),
        10
      );
      const imageUrl = normalizeImageUrl(article.find("figure img").attr("src"));

      // Extract episode ID from the link path
      const id = link ? link.split("/").filter(Boolean).pop() || "" : "";

      episodes.push({
        id,
        title,
        link,
        season: seasonNumber,
        number: episodeNumber,
        imageUrl,
      });
    });

    return episodes;
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} episodes:`, error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const url = searchParams.get("url");
    const slug = searchParams.get("slug");

    if (!url && !slug) {
      return NextResponse.json(
        { error: "Either 'url' or 'slug' parameter is required" },
        { status: 400 }
      );
    }

    const baseUrl = await getBaseUrl("animesalt");
    let detailUrl = url;

    if (slug && !url) {
      detailUrl = `${baseUrl}/${slug}`;
    }

    if (!detailUrl) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const response = await fetch(detailUrl, {
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

    // Extract post ID from season buttons or body class
    const postId =
      $(".season-btn").first().attr("data-post") ||
      $("body").attr("class")?.match(/postid-(\d+)/)?.[1] ||
      "";

    // Extract title from the styled h1
    const title = $("h1").first().text().trim();
    
    // Extract image from the bd section
    let image =
      $(".bd img").first().attr("data-src") ||
      $(".bd img").first().attr("src") ||
      "";

    // Filter out lazy load placeholder and add protocol
    if (image.startsWith("data:image/svg+xml")) {
      image = $(".bd img").first().attr("data-src") || "";
    }
    if (image.startsWith("//")) {
      image = "https:" + image;
    }

    // Extract description from overview section
    const description = $("#overview-text").text().trim();

    // Determine type from URL
    let type: "series" | "movie" | "unknown" = "unknown";
    if (detailUrl.includes("/series/")) {
      type = "series";
    } else if (detailUrl.includes("/movies/")) {
      type = "movie";
    }

    // Extract genres
    const genres: string[] = [];
    $("h4:contains('Genres')").next().find("a").each((_, element) => {
      const genre = $(element).text().trim();
      if (genre) genres.push(genre);
    });

    // Extract languages
    const languages: string[] = [];
    $("h4:contains('Languages')").next().find("a").each((_, element) => {
      const language = $(element).text().trim();
      if (language) languages.push(language);
    });

    // Extract metadata from info badges
    let totalSeasons = 0;
    let totalEpisodes = 0;
    let duration = "";
    let releaseDate = "";

    $(".bd").find("div[style*='flex']").find("div").each((_, element) => {
      const text = $(element).text().trim();
      
      if (text.includes("Seasons")) {
        const match = text.match(/(\d+)\s+Seasons/);
        if (match) totalSeasons = parseInt(match[1]);
      } else if (text.includes("Episodes")) {
        const match = text.match(/(\d+)\s+Episodes/);
        if (match) totalEpisodes = parseInt(match[1]);
      } else if (text.includes("min")) {
        duration = text;
      } else if (/^\d{4}$/.test(text)) {
        releaseDate = text;
      }
    });

    // Extract seasons if it's a series
    const seasons: Season[] = [];

    if (type === "series" && postId) {
      // Get season buttons to find total seasons
      const seasonButtons = $(".season-btn");
      
      if (totalSeasons === 0) {
        totalSeasons = seasonButtons.length;
      }

      // Fetch episodes for each season
      for (let i = 1; i <= totalSeasons; i++) {
        const episodes = await fetchSeasonEpisodes(postId, i, baseUrl);
        if (episodes.length > 0) {
          seasons.push({
            seasonNumber: i,
            episodes,
          });
        }
      }
    }

    const details: AnimeDetails = {
      postId,
      title,
      image,
      description,
      type,
      releaseDate: releaseDate || undefined,
      genres: genres.length > 0 ? genres : undefined,
      languages: languages.length > 0 ? languages : undefined,
      duration: duration || undefined,
      totalSeasons: totalSeasons > 0 ? totalSeasons : undefined,
      totalEpisodes: totalEpisodes > 0 ? totalEpisodes : undefined,
      seasons: seasons.length > 0 ? seasons : undefined,
    };

    return NextResponse.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("Error in animesalt details API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
