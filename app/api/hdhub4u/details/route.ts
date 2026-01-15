import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface DownloadLink {
  quality: string;
  url: string;
  type?: string;
}

interface Episode {
  episode: string;
  links: DownloadLink[];
}

interface MovieDetails {
  title: string;
  imageUrl: string;
  description: string;
  downloadLinks: DownloadLink[];
  episodes: Episode[];
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

    const title = $('h1.entry-title').text().trim() || 
                  $('h2').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') || '';
    const imageUrl = $('.entry-content img').first().attr('src') || 
                     $('meta[property="og:image"]').attr('content') || '';
    const description = $('.entry-content p').first().text().trim() || '';

    const downloadLinks: DownloadLink[] = [];
    const episodes: Episode[] = [];
    let currentEpisode: string | null = null;
    let currentEpisodeLinks: DownloadLink[] = [];
    
    // Extract download links from h3 and h4 tags
    $('h3, h4, h5').each((_, element) => {
      const $heading = $(element);
      const headingText = $heading.text().trim();
      
      // Check if this is an episode header
      if (headingText.match(/EPiSODE\s+\d+/i)) {
        // Save previous episode if exists
        if (currentEpisode && currentEpisodeLinks.length > 0) {
          episodes.push({
            episode: currentEpisode,
            links: [...currentEpisodeLinks],
          });
        }
        // Start new episode
        currentEpisode = headingText;
        currentEpisodeLinks = [];
      } else {
        // Extract links from this heading
        const $links = $heading.find('a');
        
        $links.each((index, linkElement) => {
          const $link = $(linkElement);
          const linkUrl = $link.attr('href') || '';
          const linkText = $link.text().trim();
          
          // Skip WATCH/PLAYER links
          if (linkUrl && linkText && 
              !linkText.toLowerCase().includes('watch') &&
              !linkText.toLowerCase().includes('player-')) {
            
            const link: DownloadLink = {
              quality: linkText,
              url: linkUrl,
            };
            
            // Check if we're in an episode section
            if (currentEpisode) {
              // Look for quality indicator in previous sibling or parent
              const qualityMatch = $heading.prev().text().match(/(480p|720p|1080p|4k|2160p)/i) ||
                                  $heading.text().match(/(480p|720p|1080p|4k|2160p)/i);
              if (qualityMatch) {
                link.type = qualityMatch[1];
              }
              currentEpisodeLinks.push(link);
            } else {
              // Pack download
              downloadLinks.push(link);
            }
          }
        });
      }
    });
    
    // Save last episode
    if (currentEpisode && currentEpisodeLinks.length > 0) {
      episodes.push({
        episode: currentEpisode,
        links: [...currentEpisodeLinks],
      });
    }

    const movieDetails: MovieDetails = {
      title,
      imageUrl,
      description,
      downloadLinks,
      episodes,
    };

    return NextResponse.json({
      success: true,
      data: movieDetails,
    });

  } catch (error) {
    console.error("Error in HDHub4u Details API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
