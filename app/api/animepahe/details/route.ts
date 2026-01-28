import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const STATIC_COOKIE = "__ddgid_=GIsAbopI81hATr14; __ddgmark_=PZvu2hO7knFJVjvc; __ddg2_=wxrBAhJcnT8W4igZ; __ddg1_=ytxmCXeUPhCjALFThP2b; res=720; aud=jpn; av1=0; latest=6441; __ddg9_=152.59.142.57; __ddg8_=egtCqGg0LH65LlEO; __ddg10_=1769617869; XSRF-TOKEN=eyJpdiI6IkdxdUo0aTJUYjg3eWUyc3l2cDFuaGc9PSIsInZhbHVlIjoiK1BLeEFySTJLdFV0c2pVVlJIMFp3a0Fqa0hSTlFyck9YeWY2all4WXVjd0J5UjM2SEFGdCtVZ1FyUjVyNGRjYkFLRWJRQzdONnZlMXZVZEs5YUVsaUdxRXhraFRUT2theVRDbEdLR2NkNHcyU1duRHFrejRCUjIyMEdKOWQ4cEwiLCJtYWMiOiI2OGZjZTBjNWRhZjUwMjJmODRkYjNkNThlMmI0M2Q2YWVmNGI0NGQwMmY0NDQ4ODNmMmQyZmM2NWExZDU2YzJkIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6IklQekYvdGQ3QXdwK1oyeWNGdnkvR0E9PSIsInZhbHVlIjoicXNuSkZjZ0lVMWs1bXZRZmFJTmk0N2hoVDYxSHl3S1pQMmExLzdQRVYxUzhPeFUvTllkdXZOQkFCY3J3RW9Tb2FZM0hudGpKL25jTmNTaDhxWHdqbzVidE4vME9lODNXTlN1MmZjNFNZVVEwc25wL1IvYUVCQURNRk45dW56aVIiLCJtYWMiOiIzNWZmZjU5YjRiNzVhNzQ1Y2I5ZDkwNWNiMTdlODdiNjFmOTY2NjFhNjRmNjY5MGU0OTMyODRjNTJmMGZjYTA4IiwidGFnIjoiIn0%3D";

interface Episode {
  id: number;
  anime_id: number;
  episode: number;
  episode2: number;
  edition: string;
  title: string;
  snapshot: string;
  disc: string;
  audio: string;
  duration: string;
  session: string;
  filler: number;
  created_at: string;
}

interface ApiResponse {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  from: number;
  to: number;
  data: Episode[];
}

async function handleSessionRequest(session: string) {
  try {
    const allEpisodes: Episode[] = [];
    let currentPage = 1;
    const maxPage = 5;

    while (currentPage <= maxPage) {
      const apiUrl = `https://animepahe.si/api?m=release&id=${session}&sort=episode_asc&page=${currentPage}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Cookie: STATIC_COOKIE,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      allEpisodes.push(...data.data);

      // Stop if we've reached the last page or if there's no next page
      if (currentPage >= data.last_page || !data.next_page_url) {
        break;
      }

      currentPage++;
    }

    return NextResponse.json({
      success: true,
      data: {
        anime_session: session,
        total_episodes: allEpisodes.length,
        episodes: allEpisodes.map((ep) => ({
          id: ep.id,
          episode: ep.episode,
          session: ep.session,
          title: ep.title,
          snapshot: ep.snapshot,
          duration: ep.duration,
          audio: ep.audio,
          filler: ep.filler,
          created_at: ep.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching episodes from API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch episodes",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const session = searchParams.get("session");

    // Handle session-based API request
    if (session) {
      return await handleSessionRequest(session);
    }

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "url or session parameter is required",
        },
        { status: 400 }
      );
    }

    // Extract anime_session and episode_session from URL
    const urlMatch = url.match(/\/play\/([^/]+)\/([^/]+)/);
    const animeSession = urlMatch ? urlMatch[1] : "";

    // Fetch the episode page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Cookie: STATIC_COOKIE,
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract data from script tag
    let episodeSession = "";
    let provider = "";
    let streamUrl = "";

    $("script").each((_, elem) => {
      const scriptContent = $(elem).html() || "";
      
      // Extract session
      const sessionMatch = scriptContent.match(/let session = "([^"]+)"/);
      if (sessionMatch) episodeSession = sessionMatch[1];

      // Extract provider
      const providerMatch = scriptContent.match(/let provider = "([^"]+)"/);
      if (providerMatch) provider = providerMatch[1];

      // Extract stream url
      const streamUrlMatch = scriptContent.match(/let url = "([^"]+)"/);
      if (streamUrlMatch) streamUrl = streamUrlMatch[1];
    });

    // Extract current episode info
    const currentEpisodeText = $("#episodeMenu").text().trim();
    const currentEpisodeMatch = currentEpisodeText.match(/Episode (\d+)/);
    const currentEpisode = currentEpisodeMatch ? parseInt(currentEpisodeMatch[1]) : 0;

    // Extract all episodes
    const episodes: Array<{
      episode: number;
      session: string;
      url: string;
      isActive: boolean;
    }> = [];

    $("#scrollArea a.dropdown-item").each((_, elem) => {
      const episodeText = $(elem).text().trim();
      const episodeMatch = episodeText.match(/Episode (\d+)/);
      const episodeNumber = episodeMatch ? parseInt(episodeMatch[1]) : 0;

      const href = $(elem).attr("href") || "";
      const sessionMatch = href.match(/\/play\/[^/]+\/([^/]+)/);
      const episodeSessionId = sessionMatch ? sessionMatch[1] : "";

      const isActive = $(elem).hasClass("active");

      episodes.push({
        episode: episodeNumber,
        session: episodeSessionId,
        url: `https://animepahe.si${href}`,
        isActive,
      });
    });

    // Extract anime title
    const animeTitle = $("title").text().replace(" - AnimePahe", "").trim();

    return NextResponse.json({
      success: true,
      data: {
        anime_session: animeSession,
        anime_title: animeTitle,
        current_episode: {
          episode: currentEpisode,
          session: episodeSession,
          provider: provider,
          stream_url: streamUrl,
        },
        episodes: episodes,
        total_episodes: episodes.length,
      },
    });
  } catch (error) {
    console.error("Error fetching animepahe details:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch details",
      },
      { status: 500 }
    );
  }
}
