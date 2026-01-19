import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateProviderAccess, createProviderErrorResponse } from '@/lib/provider-validator';

export async function GET(request: NextRequest) {
  const validation = await validateProviderAccess(request, "Adult");
  if (!validation.valid) {
    return createProviderErrorResponse(validation.error || "Unauthorized");
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = load(html);

    // Extract video information
    const videoInfo = $('p strong').first().text().trim();
    
    // Extract download link
    const downloadLink = $('p a[href*="tezfiles.com"]').attr('href') || '';
    
    // Extract script data-url
    const scriptUrl = $('script[data-url]').attr('data-url') || '';
    
    // Extract image URL
    const imageUrl = $('p img').attr('src') || '';
    const imageAlt = $('p img').attr('alt') || '';

    // Parse video info (format: mp4 | size | duration | resolution)
    const videoInfoParts = videoInfo.split('|').map(part => part.trim());
    const videoData = {
      format: videoInfoParts[0] || '',
      size: videoInfoParts[1] || '',
      duration: videoInfoParts[2] || '',
      resolution: videoInfoParts[3] || '',
    };

    // Extract file ID from download link and fetch video data from API
    let tezfilesData = null;
    if (downloadLink) {
      const fileIdMatch = downloadLink.match(/\/file\/([^\/]+)\//);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        console.log('Extracted file ID:', fileId);
        
        try {
          const tezfilesApiUrl = `https://api.tezfiles.com/v1/files/${fileId}?referer=https%3A%2F%2Fxxxstreams.org%2F`;
          const tezfilesResponse = await fetch(tezfilesApiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
              'Cookie': 'pcId=s%3Ad6e3975162df4.TXYJVJW94SUSP0HCguuNctN7YOK%2BlFdTsPVQziwwRdw; accessToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRldiJ9.eyJzdWIiOiI1YmQyYTQ4NDhkZmFlMzVhYTRlYTQ4NTkiLCJhdWQiOiJjbGllbnQiLCJ0eXBlIjoiYWNjZXNzVG9rZW4iLCJpc3MiOiJ0eiIsImNJZCI6IjViZDJhNDg0OGRmYWUzNWFhNGVhNDg1OSIsImp0aSI6IjIzZDM2YTE1Mzc5M2UiLCJpYXQiOjE3Njg2NDgzNzcsImV4cCI6MTc2OTI1MzE3N30.HoIq5d1KGaMwQ51qt8ASL30LriUjpN9q9UrEd8VQYdhzfLrs26uqaVJ7cpkLfdfYy7rDHYFKU_MSceYMTEETj8YvqnSPQIzi2iYFw4-TdoFDd0BmTtsoS3p58DQPakq3TfN0lY1-naWPO6iczqc-NZBxtZ_HjIUkwztSQ-1Y9nFAQ2jUBJBJqU4YSYYtYpUkweE8ZuZ4QHyTL3Q-09mWnv7mhfZ_MEkk01DCyQnOB-zjtdWjrGMmmIHpuRYWQJQ9wWXASpn18XX2r-5WjN7xyYbGtfhyYbmViAqJJOScQBPAzBxVeAqrLT8-1ahn8DogoZDbqiApKG_YTcXGFAcodA; refreshToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRldiJ9.eyJzdWIiOiI1YmQyYTQ4NDhkZmFlMzVhYTRlYTQ4NTkiLCJhdWQiOiJjbGllbnQiLCJ0eXBlIjoicmVmcmVzaFRva2VuIiwiaXNzIjoidHoiLCJjSWQiOiI1YmQyYTQ4NDhkZmFlMzVhYTRlYTQ4NTkiLCJqdGkiOiI3OTliM2FhYWQxYjQ3IiwiaWF0IjoxNzY4NjQ4Mzc3LCJleHAiOjE3NzEyNDAzNzd9.ATYNJZPexjJ1OQPf5Qx-WEISioVjJy2PFpXT8qrBngQM2IaxN8mqNf5u8gnS3THmsvCmCUhH_sDQ3qccASRYTXCMvNnRzD6ygDTAigtdW_O3OEN7cyep0hbxG0qHQpXbyzp8BzxcjRWm7ZEGY7YslZ64DghBhWA9NvVfinPOysTt5rUE9RVADWlDLJqzLt4xfXz-FELvlfph2Uvb-Mwj8s2BNVaK5_f0yWDnl16GXwVSK5L12pZDZmOQvkeolFWqZ0OxbcaXGgYfNS2aGQ1nAzDvMH_kdVyvDp2a3e5w8Fl_ZRdkOQEUzfciLcpI7opPoBbymcbnM6YZYFuedDK3iw',
              'Referer': 'https://tezfiles.com/',
              'Origin': 'https://tezfiles.com',
            }
          });

          if (tezfilesResponse.ok) {
            tezfilesData = await tezfilesResponse.json();
            console.log('Tezfiles API data:', JSON.stringify(tezfilesData, null, 2));
          } else {
            console.error('Failed to fetch tezfiles API:', tezfilesResponse.status);
          }
        } catch (apiError) {
          console.error('Error fetching tezfiles API:', apiError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      video: videoData,
      downloadLink: downloadLink,
      streamUrl: scriptUrl,
      thumbnail: {
        url: imageUrl,
        alt: imageAlt,
      },
      tezfilesData: tezfilesData,
    });

  } catch (error) {
    console.error('Error processing stream:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process stream data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
