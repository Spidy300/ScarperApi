import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface DownloadLink {
  quality: string;
  title: string;
  links: {
    type: string;
    url: string;
  }[];
}

interface SeriesInfo {
  imdbRating?: string;
  fullName?: string;
  season?: string;
  episode?: string;
  language?: string;
  releasedYear?: string;
  quality?: string;
  size?: string;
  zipSize?: string;
  format?: string;
}

interface MovieDetails {
  title: string;
  imageUrl: string;
  imdbRating: string;
  fullName: string;
  season?: string;
  episode?: string;
  language: string;
  releasedYear: string;
  quality: string;
  size: string;
  zipSize?: string;
  format: string;
  synopsis: string;
  screenshots: string[];
  downloadLinks: DownloadLink[];
  trailerUrl?: string;
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
        { error: "Failed to fetch movie details" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h3.entry-title').first().text().trim() || 
                  $('.single-service-contents h3').first().text().trim();
    
    const imageUrl = $('figure img').attr('bv-data-src') || 
                     $('figure img').attr('src') || '';

    const seriesInfo: SeriesInfo = {};
    $('p').each((_, el) => {
      const text = $(el).text();
      if (text.includes('IMDb Rating')) {
        seriesInfo.imdbRating = text.match(/IMDb Rating:-(.*?)\/10/)?.[1]?.trim() || 'N/A';
      }
      if (text.includes('Full Name:')) seriesInfo.fullName = text.split('Full Name:')[1]?.split('\n')[0]?.trim();
      if (text.includes('Season:')) seriesInfo.season = text.split('Season:')[1]?.split('\n')[0]?.trim();
      if (text.includes('Episode:')) seriesInfo.episode = text.split('Episode:')[1]?.split('\n')[0]?.trim();
      if (text.includes('Language:')) seriesInfo.language = text.split('Language:')[1]?.split('\n')[0]?.trim();
      if (text.includes('Released Year:')) seriesInfo.releasedYear = text.split('Released Year:')[1]?.split('\n')[0]?.trim();
      if (text.includes('Quality:')) seriesInfo.quality = text.split('Quality:')[1]?.split('\n')[0]?.trim();
      if (text.includes('Size:') && !text.includes('Zip')) seriesInfo.size = text.split('Size:')[1]?.split('\n')[0]?.trim();
      if (text.includes('Zip/Batch Size:')) seriesInfo.zipSize = text.split('Zip/Batch Size:')[1]?.split('\n')[0]?.trim();
      if (text.includes('Format:')) seriesInfo.format = text.split('Format:')[1]?.split('\n')[0]?.trim();
    });

    let synopsis = '';
    $('p').each((_, el) => {
      const text = $(el).text();
      if (text.includes('Superintendent') || text.includes('customs') || 
          (text.length > 50 && text.length < 500 && !text.includes('Download') && !text.includes('IMDb'))) {
        if (!synopsis) synopsis = text.trim();
      }
    });

    const screenshots: string[] = [];
    $('p img[data-src], p img[src]').each((_, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src') || '';
      if (src && !src.includes('youtube') && !src.includes('hqdefault')) {
        screenshots.push(src);
      }
    });

    const downloadLinks: DownloadLink[] = [];
    
    // First check for h5 headers with multiple link types (G-Direct, Zee-Cloud, Batch)
    $('h5').each((_, el) => {
      const qualityText = $(el).text();
      const links: { type: string; url: string }[] = [];
      
      $(el).next('p').find('a').each((_, linkEl) => {
        const buttonText = $(linkEl).find('button').text().trim();
        const href = $(linkEl).attr('href');
        
        if (href && buttonText) {
          let type = 'Download';
          if (buttonText.includes('G-Direct') || buttonText.includes('Instant')) {
            type = 'G-Direct';
          } else if (buttonText.includes('Zee-Cloud') || buttonText.includes('Resumable')) {
            type = 'Zee-Cloud';
          } else if (buttonText.includes('Batch') || buttonText.includes('Zip')) {
            type = 'Batch/Zip';
          }
          
          links.push({ type, url: href });
        }
      });

      if (links.length > 0) {
        downloadLinks.push({
          quality: qualityText,
          title: qualityText,
          links,
        });
      }
    });

    // If no h5 links found, check for simple "Download Now" button format
    if (downloadLinks.length === 0) {
      $('h5, h4').each((_, el) => {
        const qualityText = $(el).text().trim();
        
        // Only process if it looks like a quality description
        if (qualityText && (qualityText.includes('480p') || qualityText.includes('720p') || 
            qualityText.includes('1080p') || qualityText.includes('MB') || qualityText.includes('GB'))) {
          
          const nextP = $(el).next('p');
          const link = nextP.find('a').first();
          const href = link.attr('href');
          const buttonText = link.find('button').text().trim();
          
          if (href) {
            downloadLinks.push({
              quality: qualityText,
              title: qualityText,
              links: [{
                type: buttonText || 'Download Now',
                url: href,
              }],
            });
          }
        }
      });
    }

    const trailerDiv = $('.yt-lazy-wrapper-uniq123');
    const trailerUrl = trailerDiv.attr('data-yt-id') 
      ? `https://www.youtube.com/watch?v=${trailerDiv.attr('data-yt-id')}`
      : undefined;

    const details: MovieDetails = {
      title,
      imageUrl,
      imdbRating: seriesInfo.imdbRating || 'N/A',
      fullName: seriesInfo.fullName || title,
      season: seriesInfo.season,
      episode: seriesInfo.episode,
      language: seriesInfo.language || '',
      releasedYear: seriesInfo.releasedYear || '',
      quality: seriesInfo.quality || '',
      size: seriesInfo.size || '',
      zipSize: seriesInfo.zipSize,
      format: seriesInfo.format || '',
      synopsis,
      screenshots,
      downloadLinks,
      trailerUrl,
    };

    return NextResponse.json({
      success: true,
      data: details,
    });

  } catch (error) {
    console.error("Error in Zeefliz details API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
