import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface EpisodeLink {
  episode: string;
  episodeNumber: string;
  url: string;
  type: string;
}

interface NextdriveData {
  title: string;
  note?: string;
  episodes: EpisodeLink[];
  zeeCloudLinks: string[];
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Nextdrive page" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim() || '';
    
    const note = $('h4:contains("Note")').text().trim() || 
                 $('h4:contains("Download Manager")').text().trim();

    const episodes: EpisodeLink[] = [];
    const zeeCloudLinks: string[] = [];

    $('h4').each((_, el) => {
      const headingText = $(el).text();
      const episodeMatch = headingText.match(/-:Episodes?:\s*(\d+):-/i);
      
      if (episodeMatch) {
        const episodeNumber = episodeMatch[1];
        
        $(el).nextUntil('h4, hr').filter('p').find('a').each((_, linkEl) => {
          const href = $(linkEl).attr('href');
          const buttonText = $(linkEl).find('button').text().trim();
          
          if (href) {
            let type = 'Download';
            if (buttonText.includes('Zee-Cloud') || buttonText.includes('V-Cloud') || buttonText.includes('Resumable')) {
              type = 'Zee-Cloud';
            } else if (buttonText.includes('G-Direct') || buttonText.includes('Instant')) {
              type = 'G-Direct';
            } else if (buttonText.includes('Batch') || buttonText.includes('Zip')) {
              type = 'Batch/Zip';
            }
            
            episodes.push({
              episode: `Episode ${episodeNumber}`,
              episodeNumber,
              url: href,
              type,
            });

            if (type === 'Zee-Cloud') {
              zeeCloudLinks.push(href);
            }
          }
        });
      }
    });

    if (episodes.length === 0) {
      $('#real-post a, .post-inner a').each((_, el) => {
        const href = $(el).attr('href');
        const buttonText = $(el).find('button').text().trim();
        
        if (href && (buttonText.includes('Zee-Cloud') || buttonText.includes('V-Cloud') || buttonText.includes('Cloud'))) {
          zeeCloudLinks.push(href);
        }
      });
    }

    const data: NextdriveData = {
      title,
      note,
      episodes,
      zeeCloudLinks: [...new Set(zeeCloudLinks)],
    };

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("Error in Zeefliz Nextdrive API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
