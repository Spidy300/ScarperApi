import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface Stream {
  server: string;
  link: string;
  type: string;
}

// Headers for requests
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

async function gdFlixExtractor(link: string): Promise<Stream[]> {
  try {
    const streamLinks: Stream[] = [];
    
    console.log('gdFlixExtractor processing:', link);
    
    const response = await fetch(link, {
      headers,
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.text();
    const $drive = load(data);

    // Resume cloud extraction
    try {
      const baseUrl = link.split('/').slice(0, 3).join('/');
      const resumeDrive = $drive('.btn-secondary').attr('href') || '';
      console.log('resumeDrive:', resumeDrive);
      
      if (resumeDrive.includes('indexbot')) {
        console.log('Processing indexbot link...');
        
        const resumeBotRes = await fetch(resumeDrive, { headers });
        const resumeBotData = await resumeBotRes.text();
        
        const tokenMatch = resumeBotData.match(/formData\.append\('token', '([a-f0-9]+)'\)/);
        const pathMatch = resumeBotData.match(/fetch\('\/download\?id=([a-zA-Z0-9\/+]+)'/);
        
        if (tokenMatch && pathMatch) {
          const resumeBotToken = tokenMatch[1];
          const resumeBotPath = pathMatch[1];
          const resumeBotBaseUrl = resumeDrive.split('/download')[0];
          
          const formData = new FormData();
          formData.append('token', resumeBotToken);
          
          const resumeBotDownload = await fetch(
            resumeBotBaseUrl + '/download?id=' + resumeBotPath,
            {
              method: 'POST',
              body: formData,
              headers: {
                'Referer': resumeDrive,
                'Cookie': 'PHPSESSID=7e9658ce7c805dab5bbcea9046f7f308',
              },
            }
          );
          
          const resumeBotDownloadData = await resumeBotDownload.json();
          console.log('resumeBotDownloadData:', resumeBotDownloadData.url);
          
          if (resumeBotDownloadData.url) {
            streamLinks.push({
              server: 'ResumeBot',
              link: resumeBotDownloadData.url,
              type: 'mkv',
            });
          }
        }
      } else if (resumeDrive) {
        console.log('Processing resume cloud link...');
        
        const url = baseUrl + resumeDrive;
        const resumeDriveRes = await fetch(url, { headers });
        const resumeDriveHtml = await resumeDriveRes.text();
        const $resumeDrive = load(resumeDriveHtml);
        const resumeLink = $resumeDrive('.btn-success').attr('href');
        
        if (resumeLink) {
          console.log('Found resume link:', resumeLink);
          streamLinks.push({
            server: 'ResumeCloud',
            link: resumeLink,
            type: 'mkv',
          });
        }
      }
    } catch (err) {
      console.log('Resume link extraction failed:', err);
    }

    // Instant link extraction
    try {
      const seed = $drive('.btn-danger').attr('href') || '';
      console.log('seed:', seed);
      
      if (seed) {
        if (!seed.includes('?url=')) {
          console.log('Processing direct seed link...');
          
          // Make a HEAD request to get the redirect URL
          const headResponse = await fetch(seed, {
            method: 'HEAD',
            headers,
            redirect: 'manual'
          });
          
          let newLink = seed;
          if (headResponse.status >= 300 && headResponse.status < 400) {
            const location = headResponse.headers.get('location');
            if (location && location.includes('?url=')) {
              newLink = location.split('?url=')[1];
            }
          }
          
          streamLinks.push({
            server: 'G-Drive',
            link: newLink,
            type: 'mkv'
          });
        } else {
          console.log('Processing instant API link...');
          
          const instantToken = seed.split('=')[1];
          const videoSeedUrl = seed.split('/').slice(0, 3).join('/') + '/api';
          
          const formData = new FormData();
          formData.append('keys', instantToken);
          
          const instantLinkRes = await fetch(videoSeedUrl, {
            method: 'POST',
            body: formData,
            headers: {
              'x-token': videoSeedUrl,
              ...headers
            },
          });
          
          const instantLinkData = await instantLinkRes.json();
          console.log('instantLinkData:', instantLinkData);
          
          if (instantLinkData.error === false && instantLinkData.url) {
            streamLinks.push({
              server: 'Gdrive-Instant',
              link: instantLinkData.url,
              type: 'mkv',
            });
          } else {
            console.log('Instant link not found:', instantLinkData);
          }
        }
      }
    } catch (err) {
      console.log('Instant link extraction failed:', err);
    }

    console.log(`Extracted ${streamLinks.length} stream links`);
    return streamLinks;
  } catch (error) {
    console.log('gdFlixExtractor error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key');
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'URL parameter is required',
          usage: 'Use /api/gdflix?url=<gdflix_url>'
        },
        { status: 400 }
      );
    }

    // Validate that the URL is from a GDFlix domain
    try {
      const urlObj = new URL(url);
      const validDomains = ['gdflix.', 'gdtot.', 'gd.'];
      const isValidDomain = validDomains.some(domain => 
        urlObj.hostname.includes(domain)
      );
      
      if (!isValidDomain) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid URL. Please provide a valid GDFlix/GDTot URL.',
            providedDomain: urlObj.hostname
          },
          { status: 400 }
        );
      }
    } catch (urlError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid URL format provided' 
        },
        { status: 400 }
      );
    }

    console.log('Processing GDFlix URL:', url);

    // Extract stream links
    const streamLinks = await gdFlixExtractor(url);
    
    if (streamLinks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No stream links found',
        message: 'Could not extract any download/stream links from the provided URL',
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    return NextResponse.json({
      success: true,
      count: streamLinks.length,
      links: streamLinks,
      originalUrl: url,
      extractedAt: new Date().toISOString(),
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error) {
    console.error('GDFlix API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to extract stream links',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
