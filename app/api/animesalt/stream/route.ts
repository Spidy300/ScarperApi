import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Fetch the AnimeSalt episode page
    const response = await fetch(url, {
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

    // Find the primary video iframe
    let iframeUrl = "";
    $("iframe").each((_, element) => {
      const src = $(element).attr("src") || $(element).attr("data-src") || "";
      if (src && src.includes("as-cdn")) {
        iframeUrl = src.startsWith("//") ? "https:" + src : src;
        return false;
      }
    });

    if (!iframeUrl) {
      return NextResponse.json(
        { error: "No video iframe found" },
        { status: 404 }
      );
    }

    // Extract video ID from iframe URL
    const videoIdMatch = iframeUrl.match(/\/video\/([a-f0-9]+)/);
    if (!videoIdMatch) {
      return NextResponse.json(
        { error: "No video ID found in iframe URL" },
        { status: 404 }
      );
    }

    const videoId = videoIdMatch[1];
    const baseDomain = new URL(iframeUrl).origin;

    // Visit the iframe page to establish session
    await fetch(iframeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: url,
      },
    });

    // Make POST request to get video data
    const formData = new URLSearchParams();
    formData.append("hash", videoId);
    formData.append("r", url);

    const videoResponse = await fetch(
      `${baseDomain}/player/index.php?data=${videoId}&do=getVideo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Referer: iframeUrl,
          Origin: baseDomain,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formData.toString(),
      }
    );

    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch video data: ${videoResponse.statusText}` },
        { status: videoResponse.status }
      );
    }

    const text = await videoResponse.text();
    
    try {
      const videoData = JSON.parse(text);
      return NextResponse.json(videoData);
    } catch (parseError) {
      return NextResponse.json(
        { error: "Failed to parse JSON response", preview: text.substring(0, 200) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("AnimeSalt stream error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
