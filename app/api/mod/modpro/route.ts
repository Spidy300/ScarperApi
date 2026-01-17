import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface EpisodeLink {
  episode: string;
  url: string;
}

interface ServerLink {
  server: string;
  url: string;
  title?: string;
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
        "Referer": "https://moviesmod.build/",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch episode links" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const episodeLinks: EpisodeLink[] = [];
    const techLinks: EpisodeLink[] = [];
    const serverLinks: ServerLink[] = [];

    // Extract server/download links (Fast Server, Google Drive, etc.)
    $("a.maxbutton").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href");
      const text = $link.find(".mb-text").text().trim() || $link.text().trim();
      const title = $link.attr("title");
      
      if (href && text) {
        // Check if it's a server link (Fast Server, Google Drive, etc.)
        if (
          text.includes("Fast Server") ||
          text.includes("Google Drive") ||
          text.includes("G-Drive") ||
          text.includes("Server") ||
          text.includes("Download Links") ||
          text.includes("Mirror") ||
          href.includes("tech.unblockedgames.world")
        ) {
          // Skip if href is just "#"
          if (href !== "#") {
            serverLinks.push({
              server: text,
              url: href,
              title,
            });
          }
        }
      }
    });

    // Extract episode links from h3 tags containing links
    $("h3").each((_, element) => {
      const $h3 = $(element);
      const link = $h3.find("a");
      
      if (link.length > 0) {
        const href = link.attr("href");
        const text = link.text().trim() || $h3.text().trim();
        
        if (href) {
          // Check if it's a tech.unblockedgames.world link or similar
          if (href.includes("tech.unblockedgames.world") || href.includes("?sid=")) {
            techLinks.push({
              episode: text,
              url: href,
            });
          } else {
            episodeLinks.push({
              episode: text,
              url: href,
            });
          }
        }
      }
    });

    // Also check for links in paragraphs (alternative pattern)
    $("p a, div a").each((_, element) => {
      const $link = $(element);
      const href = $link.attr("href");
      const text = $link.text().trim();
      
      if (href && text) {
        // Check if it matches episode pattern
        if (text.toLowerCase().includes("episode") || 
            text.toLowerCase().includes("ep ") ||
            /episode\s*\d+/i.test(text)) {
          
          const exists = [...episodeLinks, ...techLinks].some(
            (item) => item.url === href
          );
          
          if (!exists) {
            if (href.includes("tech.unblockedgames.world") || href.includes("?sid=")) {
              techLinks.push({
                episode: text,
                url: href,
              });
            } else {
              episodeLinks.push({
                episode: text,
                url: href,
              });
            }
          }
        }
      }
    });

    // Extract any download links that might be present
    const downloadLinks: string[] = [];
    $("a").each((_, element) => {
      const href = $(element).attr("href");
      if (
        href &&
        (href.includes("download") ||
          href.includes("drive.google.com") ||
          href.includes("dropbox") ||
          href.includes("mediafire") ||
          href.includes("mega.nz") ||
          href.includes("gdtot") ||
          href.includes("uploadrar") ||
          href.includes("hubdrive"))
      ) {
        if (!downloadLinks.includes(href)) {
          downloadLinks.push(href);
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        serverLinks,
        episodeLinks,
        techLinks,
        downloadLinks,
        totalEpisodes: episodeLinks.length + techLinks.length,
      },
    });
  } catch (error) {
    console.error("Modpro API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch episode links",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
