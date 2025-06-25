import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface TelegramLink {
  quality: string;
  id: string;
  name: string;
  size: string;
  streamUrl: string;
}

interface SeasonData {
  season_number: number;
  episodes: any[];
  telegram: TelegramLink[];
}

interface MoviesWorldDetailItem {
  _id: string;
  tmdb_id: number;
  title: string;
  genres: string[];
  description: string;
  rating: number;
  release_year: number;
  poster: string;
  backdrop: string;
  media_type: 'movie' | 'tv';
  runtime?: number;
  updated_on: string;
  languages: string[];
  rip: string;
  telegram: TelegramLink[];
  type: string;
  total_seasons?: number;
  total_episodes?: number;
  seasons?: SeasonData[];
}

interface MoviesWorldDetailResponse {
  success: boolean;
  data?: MoviesWorldDetailItem;
  error?: string;
  message?: string;
  remainingRequests?: number;
}

async function fetchMoviesWorldDetails(id: string): Promise<MoviesWorldDetailItem> {
  try {
    const url = `https://moviesworld738-e52c71f18b14.herokuapp.com/api/id/${id}`;
    
    console.log(`Fetching MoviesWorld details from: ${url}`);

    const response = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch details: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data || !data._id || !data.title) {
      throw new Error('Invalid response format from MoviesWorld API');
    }

    // Add stream URLs to telegram links
    if (data.telegram && Array.isArray(data.telegram)) {
      data.telegram = data.telegram.map((link: any) => ({
        ...link,
        streamUrl: `https://moviesworld738-e52c71f18b14.herokuapp.com/dl/${link.id}/${encodeURIComponent(link.name)}`
      }));
    }

    // If it's a TV show with seasons, fetch all seasons
    if (data.total_seasons && data.total_seasons > 0) {
      const seasons: SeasonData[] = [];
      
      for (let seasonNum = 1; seasonNum <= data.total_seasons; seasonNum++) {
        try {
          const seasonUrl = `https://moviesworld738-e52c71f18b14.herokuapp.com/api/id/${id}?season_number=${seasonNum}`;
          const seasonResponse = await fetch(seasonUrl, {
            cache: 'no-cache',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout for season fetch
          });

          if (seasonResponse.ok) {
            const seasonData = await seasonResponse.json();
            
            // Add stream URLs to season telegram links
            if (seasonData.telegram && Array.isArray(seasonData.telegram)) {
              seasonData.telegram = seasonData.telegram.map((link: any) => ({
                ...link,
                streamUrl: `https://moviesworld738-e52c71f18b14.herokuapp.com/dl/${link.id}/${encodeURIComponent(link.name)}`
              }));
            }

            seasons.push({
              season_number: seasonNum,
              episodes: seasonData.episodes || [],
              telegram: seasonData.telegram || []
            });
          }
        } catch (seasonError) {
          console.log(`Failed to fetch season ${seasonNum}:`, seasonError);
        }
      }
      
      data.seasons = seasons;
    }

    console.log(`Successfully fetched details for: ${data.title}`);
    return data;

  } catch (error) {
    console.error('Error fetching MoviesWorld details:', error);
    throw error;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<MoviesWorldDetailResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<MoviesWorldDetailResponse>;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<MoviesWorldDetailResponse>(
        { 
          success: false, 
          error: 'ID is required',
          message: 'Please provide a valid MoviesWorld ID parameter'
        },
        { status: 400 }
      );
    }

    // Validate ID format (should be a valid MongoDB ObjectId or number)
    if (!/^[a-f\d]{24}$/i.test(id) && !/^\d+$/.test(id)) {
      return NextResponse.json<MoviesWorldDetailResponse>(
        { 
          success: false, 
          error: 'Invalid ID format',
          message: 'ID must be a valid MongoDB ObjectId or numeric ID'
        },
        { status: 400 }
      );
    }

    console.log('Processing MoviesWorld details request for ID:', id);

    const details = await fetchMoviesWorldDetails(id);

    return NextResponse.json<MoviesWorldDetailResponse>({
      success: true,
      data: details,
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('MoviesWorld details API error:', error);
    
    // Handle specific error cases
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json<MoviesWorldDetailResponse>(
        { 
          success: false, 
          error: 'Content not found',
          message: 'The requested movie/TV show was not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json<MoviesWorldDetailResponse>(
      { 
        success: false, 
        error: 'Failed to fetch details from MoviesWorld',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
