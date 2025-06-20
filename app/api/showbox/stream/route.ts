import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface Stream {
  server: string;
  type: string;
  link: string;
}

interface ShowboxStreamResponse {
  success: boolean;
  data?: {
    id: string;
    streams: Stream[];
    totalStreams: number;
  };
  error?: string;
  message?: string;
  remainingRequests?: number;
}

async function sbGetStream(id: string): Promise<Stream[]> {
  try {
    const stream: Stream[] = [];
    const [fileKey, epId] = id.split('&');
    
    // If epId is empty, use fileKey as the file ID
    const actualFileId = epId || fileKey;
    
    const url = `https://febbox.vercel.app/api/video-quality?fid=${actualFileId}`;
    console.log('sbGetStream url', url);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch stream: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Response data:', data); // Debug log
    
    // Check if data.html exists and is a string
    if (!data.html || typeof data.html !== 'string') {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format - html field is missing or not a string');
    }
    
    const $ = load(data.html);
    
    $('.file_quality').each((i, el) => {
      const server =
        $(el).find('p.name').text() +
        ' - ' +
        $(el).find('p.size').text() +
        ' - ' +
        $(el).find('p.speed').text();
      const link = $(el).attr('data-url');
      if (link) {
        stream.push({
          server: server,
          type: 'mkv',
          link: link,
        });
      }
    });

    return stream;
  } catch (err) {
    console.log('getStream error', err);
    return [];
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ShowboxStreamResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<ShowboxStreamResponse>;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ShowboxStreamResponse>(
        { 
          success: false, 
          error: 'ID is required',
          message: 'Please provide a Showbox episode ID parameter'
        },
        { status: 400 }
      );
    }

    console.log('Processing Showbox stream request for ID:', id);

    const streams = await sbGetStream(id);

    if (!streams || streams.length === 0) {
      return NextResponse.json<ShowboxStreamResponse>({
        success: false,
        error: 'No streams found',
        message: 'No streaming links could be extracted from the provided ID',
        remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
      });
    }

    return NextResponse.json<ShowboxStreamResponse>({
      success: true,
      data: {
        id,
        streams,
        totalStreams: streams.length
      },
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('Showbox stream API error:', error);
    
    return NextResponse.json<ShowboxStreamResponse>(
      { 
        success: false, 
        error: 'Failed to extract stream links',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
