import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface FileInfo {
  fileName: string;
  format: string;
  fileSize: string;
  addedOn: string;
}

interface HubCloudLink {
  url: string;
  title: string;
}

interface ZinkCloudDetails {
  fileInfo: FileInfo;
  hubCloudLinks: HubCloudLink[];
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
        { error: "Failed to fetch zinkcloud details" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let fileName = "";
    let format = "";
    let fileSize = "";
    let addedOn = "";

    $('.file-info .info-item').each((_, element) => {
      const $item = $(element);
      const label = $item.find('.info-label').text().trim();
      const value = $item.find('.info-value').text().trim();

      if (label === "File Name") {
        fileName = value;
      } else if (label === "Format") {
        format = value;
      } else if (label === "File Size") {
        fileSize = value;
      } else if (label === "Added On") {
        addedOn = value;
      }
    });

    const hubCloudLinks: HubCloudLink[] = [];
    $('.mirror-buttons a.btn.hubcloud').each((_, element) => {
      const $link = $(element);
      const linkUrl = $link.attr('href') || '';
      const title = $link.text().trim().replace(/\s+/g, ' ');
      
      if (linkUrl) {
        hubCloudLinks.push({
          url: linkUrl,
          title,
        });
      }
    });

    const zinkCloudDetails: ZinkCloudDetails = {
      fileInfo: {
        fileName,
        format,
        fileSize,
        addedOn,
      },
      hubCloudLinks,
    };

    return NextResponse.json({
      success: true,
      data: zinkCloudDetails,
    });

  } catch (error) {
    console.error("Error in ZinkCloud API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
