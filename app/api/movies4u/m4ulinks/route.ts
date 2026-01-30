import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface DownloadOption {
  label: string;
  url: string;
  type: string; // Hub-Cloud, Direct-Drive-link, G-Drive, etc.
}

interface QualityDownload {
  quality: string;
  size: string;
  options: DownloadOption[];
}

interface M4ULinksData {
  title: string;
  note: string;
  downloads: QualityDownload[];
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

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch download links" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $('.entry-title').text().trim();

    // Extract note/warning
    const note = $('.alert-box p').first().text().trim();

    // Extract download links by quality
    const downloads: QualityDownload[] = [];

    $('.download-links-div h4').each((_, element) => {
      const $h4 = $(element);
      const qualityText = $h4.text().trim();
      
      // Parse quality and size
      // Example: "480p [350MB]" or "720p HEVC [650MB]"
      const match = qualityText.match(/^(.+?)\s*\[(.+?)\]/);
      
      if (match) {
        const quality = match[1].trim();
        const size = match[2].trim();
        
        const options: DownloadOption[] = [];
        
        // Get the next sibling which contains download buttons
        const $downloadDiv = $h4.next('.downloads-btns-div');
        
        $downloadDiv.find('a.btn').each((_, linkElement) => {
          const $link = $(linkElement);
          const linkUrl = $link.attr('href');
          const linkText = $link.text().trim();
          
          if (linkUrl) {
            // Determine link type from text or URL
            let type = 'Unknown';
            if (linkText.includes('Hub-Cloud [DD]')) {
              type = 'Hub-Cloud';
            } else if (linkText.includes('Direct') || linkText.includes('Drive-link')) {
              type = 'Direct-Drive-link';
            } else if (linkText.includes('G-Drive')) {
              type = 'G-Drive';
            } else if (linkText.includes('Telegram')) {
              type = 'Telegram';
            } 
            
            
            options.push({
              label: linkText,
              url: linkUrl,
              type,
            });
          }
        });
        
        if (options.length > 0) {
          downloads.push({
            quality,
            size,
            options,
          });
        }
      }
    });

    // Extract hubcloud links specifically
    const hubcloudLinks = downloads
      .flatMap(d => d.options)
      .filter(opt => opt.type === 'Hub-Cloud')
      .map(opt => opt.url);

    const data: M4ULinksData = {
      title,
      note,
      downloads,
    };

    return NextResponse.json({
      success: true,
      data,
      hubcloudLinks, // Separate array of just hubcloud links
    });

  } catch (error) {
    console.error("Error in M4U Links API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
