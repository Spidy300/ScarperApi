import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface StreamLink {
  server: string;
  link: string;
  type: string;
  copyable?: boolean;
}

interface HDHub4uStreamResponse {
  success: boolean;
  data?: {
    episodeUrl: string;
    streamLinks: StreamLink[];
  };
  error?: string;
  message?: string;
  remainingRequests?: number;
}

function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, function (char) {
    const charCode = char.charCodeAt(0);
    const isUpperCase = char <= 'Z';
    const baseCharCode = isUpperCase ? 65 : 97;
    return String.fromCharCode(
      ((charCode - baseCharCode + 13) % 26) + baseCharCode,
    );
  });
}

function decodeString(encryptedString: string): any {
  try {
    console.log('Starting decode with:', encryptedString);
    
    // First base64 decode
    let decoded = atob(encryptedString);
    console.log('After first base64 decode:', decoded);

    // Second base64 decode
    decoded = atob(decoded);
    console.log('After second base64 decode:', decoded);

    // ROT13 decode
    decoded = rot13(decoded);
    console.log('After ROT13 decode:', decoded);

    // Third base64 decode
    decoded = atob(decoded);
    console.log('After third base64 decode:', decoded);

    // Parse JSON
    const result = JSON.parse(decoded);
    console.log('Final parsed result:', result);
    return result;
  } catch (error) {
    console.error('Error decoding string:', error);
    
    // Try alternative decoding approaches
    try {
      console.log('Trying alternative decode approach...');
      let altDecoded = atob(encryptedString);
      altDecoded = atob(altDecoded);
      const altResult = JSON.parse(altDecoded);
      console.log('Alternative decode successful:', altResult);
      return altResult;
    } catch (altError) {
      console.error('Alternative decode also failed:', altError);
      return null;
    }
  }
}

function encode(value: string): string {
  return btoa(value.toString());
}

function decode(value: string): string {
  if (value === undefined) {
    return '';
  }
  return atob(value.toString());
}

function pen(value: string): string {
  return value.replace(/[a-zA-Z]/g, function (char: string) {
    return String.fromCharCode(
      (char <= 'Z' ? 90 : 122) >=
        (char = char.charCodeAt(0) + 13)
        ? char
        : char - 26,
    );
  });
}

async function getRedirectLinks(link: string): Promise<string> {
  try {
    const res = await fetch(link, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    const resText = await res.text();

    const regex = /ck\('_wp_http_\d+','([^']+)'/g;
    let combinedString = '';

    let match;
    while ((match = regex.exec(resText)) !== null) {
      combinedString += match[1];
    }
    
    const decodedString = decode(pen(decode(decode(combinedString))));
    const data = JSON.parse(decodedString);
    console.log('Redirect data:', data);
    
    const token = encode(data?.data);
    const blogLink = data?.wp_http1 + '?re=' + token;
    
    // Wait for the required time
    const waitTime = (Number(data?.total_time) + 3) * 1000;
    console.log(`Waiting ${waitTime}ms before proceeding...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    console.log('Blog link:', blogLink);
    return blogLink;
  } catch (err) {
    console.log('Error in getRedirectLinks:', err);
    return link;
  }
}

async function extractHBLinksStream(hbUrl: string): Promise<StreamLink[]> {
  try {
    console.log('Processing HBLinks URL:', hbUrl);
    
    const response = await fetch(hbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    const html = await response.text();
    const $ = load(html);
    
    const streamLinks: StreamLink[] = [];
    
    // Extract episode download links from hubdrive.wales
    $('.entry-content h5 a[href*="hubdrive.wales"]').each((_, element) => {
      const $link = $(element);
      const url = $link.attr('href');
      const text = $link.text().trim();
      
      if (url && text) {
        // Extract episode number and size from text
        const episodeMatch = text.match(/Episode\s*(\d+)/i);
        const sizeMatch = text.match(/(\d+(?:\.\d+)?\s*[MG]B)/i);
        
        const episodeNum = episodeMatch ? episodeMatch[1] : 'Unknown';
        const size = sizeMatch ? sizeMatch[1] : 'Unknown';
        
        streamLinks.push({
          server: `HBLinks Episode ${episodeNum}`,
          link: url,
          type: 'download',
          copyable: true
        });
      }
    });

    // Extract quality-based download links from h3 elements
    $('.entry-content h3').each((_, element) => {
      const $h3 = $(element);
      const h3Text = $h3.text().trim();
      
      // Check for quality patterns (480p, 720p, 1080p)
      const qualityMatch = h3Text.match(/(480p|720p|1080p)/i);
      if (qualityMatch) {
        const quality = qualityMatch[1];
        
        // Extract Drive and Direct links only (skip Instant)
        $h3.find('a').each((_, linkEl) => {
          const $link = $(linkEl);
          const linkText = $link.text().trim();
          const linkHref = $link.attr('href');
          
          if (linkHref && linkText) {
            let server = '';
            if (linkText === 'Drive' && linkHref.includes('hubdrive.wales')) {
              server = `HBLinks ${quality} Drive`;
            } else if (linkText === 'Direct' && linkHref.includes('hubcloud.one')) {
              server = `HBLinks ${quality} Direct`;
            }
            
            if (server) {
              streamLinks.push({
                server,
                link: linkHref,
                type: 'download',
                copyable: true
              });
            }
          }
        });
      }
    });
    
    // Extract image-based download links
    $('a[href*="hubcloud.one"] img, a[href*="hubdrive.wales"] img').each((_, element) => {
      const $img = $(element);
      const $link = $img.closest('a');
      const linkHref = $link.attr('href');
      const imgSrc = $img.attr('src');
      
      if (linkHref) {
        let server = '';
        if (linkHref.includes('hubcloud.one') && imgSrc && imgSrc.includes('Cloud-Logo')) {
          server = 'HBLinks Cloud Image';
        } else if (linkHref.includes('hubdrive.wales') && imgSrc && imgSrc.includes('Hubdrive')) {
          server = 'HBLinks Drive Image';
        }
        
        if (server && !streamLinks.some(link => link.link === linkHref)) {
          streamLinks.push({
            server,
            link: linkHref,
            type: 'download',
            copyable: true
          });
        }
      }
    });

    // Fallback: Extract ANY hubdrive.wales and hubcloud.one links found on the page
    $('a[href*="hubdrive.wales"], a[href*="hubcloud.one"]').each((_, element) => {
      const $link = $(element);
      const linkHref = $link.attr('href');
      const linkText = $link.text().trim();
      
      if (linkHref && !streamLinks.some(link => link.link === linkHref)) {
        let server = '';
        if (linkHref.includes('hubdrive.wales')) {
          server = 'HBLinks Fallback Drive';
        } else if (linkHref.includes('hubcloud.one')) {
          server = 'HBLinks Fallback Cloud';
        }
        
        if (server) {
          streamLinks.push({
            server,
            link: linkHref,
            type: 'download',
            copyable: true
          });
        }
      }
    });
    
    // Extract streaming links from various patterns
    $('a[href*="streamtape"], a[href*="doodstream"], a[href*="mixdrop"], a[href*="upstream"]').each((_, element) => {
      const $link = $(element);
      const url = $link.attr('href');
      
      if (url) {
        let server = 'Unknown';
        if (url.includes('streamtape')) server = 'StreamTape';
        else if (url.includes('doodstream')) server = 'DoodStream';
        else if (url.includes('mixdrop')) server = 'MixDrop';
        else if (url.includes('upstream')) server = 'UpStream';
        
        streamLinks.push({
          server: `HBLinks ${server}`,
          link: url,
          type: 'redirect',
          copyable: true
        });
      }
    });
    
    // Also look for direct video links
    $('a[href$=".mp4"], a[href$=".mkv"], a[href*=".mp4"], a[href*="video"]').each((_, element) => {
      const $link = $(element);
      const url = $link.attr('href');
      
      if (url && !streamLinks.some(link => link.link === url)) {
        streamLinks.push({
          server: 'HBLinks Direct',
          link: url,
          type: 'mp4',
          copyable: true
        });
      }
    });
    
    console.log(`Extracted ${streamLinks.length} links from HBLinks`);
    return streamLinks;
    
  } catch (error) {
    console.error('Error extracting HBLinks stream:', error);
    return [];
  }
}

async function hdhub4uGetStream(link: string): Promise<StreamLink[]> {
  try {
    console.log('Processing stream link:', link);

    const allStreamLinks: StreamLink[] = [];

    const res = await fetch(link, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    
    const text = await res.text();
    
    // Always check for HBLinks URL in the response
    const hbLinksMatch = text.match(/https:\/\/hblinks\.pro\/archives\/\d+/);
    if (hbLinksMatch) {
      console.log('Found HBLinks URL:', hbLinksMatch[0]);
      const hbLinksStreams = await extractHBLinksStream(hbLinksMatch[0]);
      allStreamLinks.push(...hbLinksStreams);
    }
    
    const encryptedString = text.split("s('o','")?.[1]?.split("',180")?.[0];
    console.log('Encrypted string:', encryptedString);
    
    if (encryptedString) {
      const decodedString: any = decodeString(encryptedString);
      console.log('Decoded string:', decodedString);
      
      if (decodedString?.o) {
        const redirectUrl = atob(decodedString.o);
        console.log('Redirect URL:', redirectUrl);

        const redirectLink = await getRedirectLinks(redirectUrl);
        console.log('Final redirect link:', redirectLink);

        // Check if redirect link contains hblinks.pro
        if (redirectLink.includes('hblinks.pro')) {
          console.log('Redirect link contains hblinks.pro, extracting from:', redirectLink);
          const hbLinksStreams = await extractHBLinksStream(redirectLink);
          allStreamLinks.push(...hbLinksStreams);
        } else {
          allStreamLinks.push({
            server: 'HDHub4u Redirect',
            link: redirectLink,
            type: 'redirect',
            copyable: true,
          });
        }
      }
    }

    return allStreamLinks;

  } catch (error) {
    console.error('Error in stream extraction:', error);
    return [];
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<HDHub4uStreamResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<HDHub4uStreamResponse>;
    }

    const { searchParams } = new URL(request.url);
    const episodeUrl = searchParams.get('url');

    if (!episodeUrl) {
      return NextResponse.json<HDHub4uStreamResponse>(
        { 
          success: false, 
          error: 'Episode URL is required',
          message: 'Please provide an episode URL parameter'
        },
        { status: 400 }
      );
    }

    console.log('Processing stream request for URL:', episodeUrl);

    let streamLinks: StreamLink[] = [];

    // Handle hblinks.pro URLs directly
    if (episodeUrl.includes('hblinks.pro')) {
      streamLinks = await extractHBLinksStream(episodeUrl);
    } else {
      // Handle all other URLs
      streamLinks = await hdhub4uGetStream(episodeUrl);
    }

    if (!streamLinks || streamLinks.length === 0) {
      return NextResponse.json<HDHub4uStreamResponse>({
        success: false,
        error: 'No stream links found',
        message: 'No streaming links could be extracted from the provided URL',
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    return NextResponse.json<HDHub4uStreamResponse>({
      success: true,
      data: {
        episodeUrl,
        streamLinks
      },
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('Stream API error:', error);
    
    return NextResponse.json<HDHub4uStreamResponse>(
      { 
        success: false, 
        error: 'Failed to extract stream links',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
