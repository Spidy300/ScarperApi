import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface DownloadLink {
  label: string;
  url: string;
}

interface FileInfo {
  fileName?: string;
  size?: string;
  format?: string;
  dateAdded?: string;
}

interface MagicLinksResponse {
  success: boolean;
  data?: {
    fileInfo: FileInfo;
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
        } as MagicLinksResponse,
        { status: 400 }
      );
    }

    // Fetch the magic links page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://kmmovies.store/",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch magic links: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract file info
    const fileInfo: FileInfo = {};
    
    $(".file-details p").each((_, elem) => {
      const text = $(elem).text().trim();
      const strongText = $(elem).find("strong").text().trim();
      const value = text.replace(strongText, "").trim();

      if (strongText.includes("File Name:")) {
        fileInfo.fileName = value;
      } else if (strongText.includes("Size:")) {
        fileInfo.size = value;
      } else if (strongText.includes("Format:")) {
        fileInfo.format = value;
      } else if (strongText.includes("Date Added:")) {
        fileInfo.dateAdded = value;
      }
    });

    // Extract download links
    const downloadLinks: DownloadLink[] = [];
    
    $(".download-buttons a.download-button").each((_, elem) => {
      const url = $(elem).attr("href");
      const label = $(elem).text().trim();

      if (url && label) {
        downloadLinks.push({
          label,
          url,
        });
      }
    });

    // Resolve final URLs for WATCH ONLINE links
    const resolvedLinks = await Promise.all(
      downloadLinks.map(async (link) => {
        if (link.label === "WATCH ONLINE" || link.label === "WATCH ONLINE 2") {
          try {
            const redirectApiUrl = `https://net-cookie-kacj.vercel.app/api/redirect?url=${encodeURIComponent(link.url)}`;
            const redirectResponse = await fetch(redirectApiUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });

            if (redirectResponse.ok) {
              const redirectData = await redirectResponse.json();
              if (redirectData.data?.finalUrl) {
                return {
                  ...link,
                  url: redirectData.data.finalUrl,
                };
              }
            }
          } catch (error) {
            console.error(`Failed to resolve URL for ${link.label}:`, error);
          }
        }
        return link;
      })
    );

    const responseData: MagicLinksResponse = {
      success: true,
      data: {
        fileInfo,
        downloadLinks: resolvedLinks,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching magic links:", error);

    const errorResponse: MagicLinksResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch magic links",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
