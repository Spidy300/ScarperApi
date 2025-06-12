import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface DownloadLink {
  url: string;
  server: string;
  type: 'download';
  resumeSupported: boolean;
  description: string;
}

interface VCloudResponse {
  success: boolean;
  originalUrl?: string;
  downloadLinks?: DownloadLink[];
  totalLinks?: number;
  extractedAt?: string;
  remainingRequests?: number;
  error?: string;
  message?: string;
  details?: string;
  usage?: string;
  providedDomain?: string;
}

async function extractVCloudUrl(vcloudUrl: string): Promise<string | null> {
  try {
    console.log(`Extracting VCloud URL from: ${vcloudUrl}`);
    
    const response = await fetch(vcloudUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://vcloud.lol/',
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch VCloud page: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract the URL from the JavaScript variable
    // Looking for: var url = 'https://...';
    const urlMatch = html.match(/var\s+url\s*=\s*['"`]([^'"`]+)['"`]/);
    
    if (urlMatch && urlMatch[1]) {
      const extractedUrl = urlMatch[1];
      console.log(`Successfully extracted URL: ${extractedUrl}`);
      return extractedUrl;
    }
    
    // Alternative pattern matching in case the format is slightly different
    const altUrlMatch = html.match(/url\s*=\s*['"`]([^'"`]+)['"`]/);
    if (altUrlMatch && altUrlMatch[1]) {
      const extractedUrl = altUrlMatch[1];
      console.log(`Successfully extracted URL (alternative pattern): ${extractedUrl}`);
      return extractedUrl;
    }
    
    // Look for any hubcloud.php URLs in the page
    const hubcloudMatch = html.match(/['"`](https?:\/\/[^'"`]*hubcloud\.php[^'"`]*)['"`]/);
    if (hubcloudMatch && hubcloudMatch[1]) {
      const extractedUrl = hubcloudMatch[1];
      console.log(`Successfully extracted hubcloud URL: ${extractedUrl}`);
      return extractedUrl;
    }
    
    console.log('No URL found in the VCloud page');
    return null;
  } catch (error) {
    console.error('Error extracting VCloud URL:', error);
    throw error;
  }
}

async function extractDownloadLinks(intermediateUrl: string): Promise<DownloadLink[]> {
  try {
    console.log(`Fetching download links from: ${intermediateUrl}`);
    
    const response = await fetch(intermediateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://vcloud.lol/',
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch download page: ${response.status}`);
    }

    const html: string = await response.text();
    const downloadLinks: DownloadLink[] = [];

    // Extract 10Gbps Server link (btn-danger)
    const gbpsMatch = html.match(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*btn[^"]*btn-danger[^"]*"[^>]*>[\s\S]*?Download[\s\S]*?\[Server\s*:\s*10Gbps\]/i);
    if (gbpsMatch && gbpsMatch[1]) {
      downloadLinks.push({
        url: gbpsMatch[1],
        server: '10Gbps',
        type: 'download',
        resumeSupported: false,
        description: 'High-speed server (Resume not supported)'
      });
    }

    // Extract Server 1 link (btn-success)
    const server1Match = html.match(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*btn[^"]*btn-success[^"]*"[^>]*>[\s\S]*?Download[\s\S]*?\[Server\s*:\s*1\]/i);
    if (server1Match && server1Match[1]) {
      downloadLinks.push({
        url: server1Match[1],
        server: 'Server 1',
        type: 'download',
        resumeSupported: true,
        description: 'Standard download server'
      });
    }

    // Define URLs to exclude from results
    const excludedUrls: string[] = [
      'https://www.google.com/search?q=idm+dowload+manager',
      'https://t.me/+_CVU9nIEj5oxYzc9'
    ];

    // Define domains/patterns to exclude
    const excludedPatterns: string[] = [
      'google.com/search',
      't.me/',
      'telegram.me/',
      'whatsapp.com',
      'facebook.com',
      'twitter.com',
      'instagram.com'
    ];

    // Extract any other download links (looking for direct URLs in href attributes)
    const allLinkMatches: RegExpMatchArray | null = html.match(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*(?:class="[^"]*btn[^"]*")?[^>]*>[\s\S]*?(?:Download|download)/gi);
    if (allLinkMatches) {
      allLinkMatches.forEach((match: string, index: number) => {
        const urlMatch = match.match(/href="([^"]+)"/);
        if (urlMatch && urlMatch[1]) {
          const url: string = urlMatch[1];
          
          // Skip if URL is in excluded list
          if (excludedUrls.includes(url)) {
            return;
          }
          
          // Skip if URL matches any excluded pattern
          if (excludedPatterns.some(pattern => url.includes(pattern))) {
            return;
          }
          
          // Skip if we already have this URL
          if (!downloadLinks.some((link: DownloadLink) => link.url === url)) {
            // Determine server type based on URL or content
            let serverType: string = 'Unknown';
            let resumeSupported: boolean = true;
            
            if (url.includes('gpdl2.hubcdn.fans') || match.includes('10Gbps')) {
              serverType = '10Gbps';
              resumeSupported = false;
            } else if (url.includes('pub-') && url.includes('.r2.dev')) {
              serverType = 'R2 CDN';
            } else if (url.includes('ampproject.org')) {
              serverType = 'AMP Redirect';
              resumeSupported = false;
            }
            
            // Only add if it's a valid download link (not social media, search engines, etc.)
            if (serverType !== 'Unknown' || url.includes('download') || url.includes('.mkv') || url.includes('.mp4') || url.includes('.avi')) {
              downloadLinks.push({
                url: url,
                server: serverType,
                type: 'download',
                resumeSupported: resumeSupported,
                description: `${serverType} download link`
              });
            }
          }
        }
      });
    }

    console.log(`Successfully extracted ${downloadLinks.length} download links`);
    return downloadLinks;
  } catch (error) {
    console.error('Error extracting download links:', error);
    throw error;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<VCloudResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<VCloudResponse>;
    }

    const { searchParams } = new URL(request.url);
    const url: string | null = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json<VCloudResponse>(
        { 
          success: false, 
          error: 'URL parameter is required',
          usage: 'Use /api/vcloud?url=<vcloud_url>'
        },
        { status: 400 }
      );
    }

    // Validate that the URL is from VCloud
    try {
      const urlObj = new URL(url);
      const validDomains: string[] = ['vcloud.lol', 'vcloud.', 'v-cloud'];
      const isValidDomain: boolean = validDomains.some((domain: string) => 
        urlObj.hostname.includes(domain)
      );
      
      if (!isValidDomain) {
        return NextResponse.json<VCloudResponse>(
          { 
            success: false, 
            error: 'Invalid URL. Please provide a valid VCloud URL.',
            providedDomain: urlObj.hostname
          },
          { status: 400 }
        );
      }
    } catch (urlError) {
      return NextResponse.json<VCloudResponse>(
        { 
          success: false, 
          error: 'Invalid URL format provided' 
        },
        { status: 400 }
      );
    }

    console.log('Processing VCloud URL:', url);

    // Step 1: Extract the intermediate URL
    const intermediateUrl: string | null = await extractVCloudUrl(url);
    
    if (!intermediateUrl) {
      return NextResponse.json<VCloudResponse>({
        success: false,
        error: 'No intermediate URL found',
        message: 'Could not extract the intermediate URL from the VCloud page',
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    // Step 2: Extract the actual download links
    const downloadLinks: DownloadLink[] = await extractDownloadLinks(intermediateUrl);
    
    if (!downloadLinks || downloadLinks.length === 0) {
      return NextResponse.json<VCloudResponse>({
        success: false,
        error: 'No download links found',
        message: 'Could not extract download links from the VCloud download page',
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    return NextResponse.json<VCloudResponse>({
      success: true,
      originalUrl: url,
      downloadLinks: downloadLinks,
      totalLinks: downloadLinks.length,
      extractedAt: new Date().toISOString(),
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('VCloud API error:', error);
    
    return NextResponse.json<VCloudResponse>(
      { 
        success: false, 
        error: 'Failed to extract VCloud download links',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
