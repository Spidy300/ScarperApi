import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/middleware/api-auth';

interface ShowboxEpisodeResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  remainingRequests?: number;
}

const headers = {
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.9,en-IN;q=0.8',
  'cache-control': 'no-cache',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  pragma: 'no-cache',
  priority: 'u=1, i',
  'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Microsoft Edge";v="134"',
  'sec-ch-ua-arch': '"x86"',
  'sec-ch-ua-bitness': '"64"',
  'sec-ch-ua-full-version': '"134.0.3124.83"',
  'sec-ch-ua-full-version-list': '"Chromium";v="134.0.6998.118", "Not:A-Brand";v="24.0.0.0", "Microsoft Edge";v="134.0.3124.83"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-model': '""',
  'sec-ch-ua-platform': '"Windows"',
  'sec-ch-ua-platform-version': '"19.0.0"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest',
  cookie: 'ext_name=ojplmecpdpgccookcobabopnaifgidhf; ci=167dea138333aa; cf_clearance=F3Z5jQdACVu5drghUljgmK3dhdEOZYzsniaa0NdJVNA-1742648415-1.2.1.1-d.Ca2P0QkU14cC0m2vtrvJVSBuwxHAt97GLurkp77PhO8ds7ttvUi4rT70ynq0B0shpfbnBRT0G767aiVcn3K4Pee2kOH_mhpcZQsaba8XYDtv40uA1bOW5H0Ec3rW_ZVI8OHbcc8LOTAEinRFMrUQx1ndtX774eZ4SiDFDofRSJ.UClV22dKqe1qRxAPlBXUl2we9ZaVt3YUFebfaRSup1eqZ8OLDP05X2X3CDk5QBMlPbSgU.cLyJYevWBbcsAh3Jo8UnMBghAcSGwhHeq.bgL4SfK4qLBej9rh7FdTxksN0MsovGgucUNyud_sOrLWMZ.uLlgUAApoXrYR.5PwJODNEFesP9rDXNxwR3PcMc',
  Referer: 'https://www.showbox.media/movie/m-captain-america-brave-new-world-2024',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export async function GET(request: NextRequest): Promise<NextResponse<ShowboxEpisodeResponse>> {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.isValid) {
      return createUnauthorizedResponse(authResult.error || 'Invalid API key') as NextResponse<ShowboxEpisodeResponse>;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ShowboxEpisodeResponse>(
        { 
          success: false, 
          error: 'ID is required',
          message: 'Please provide a valid ID parameter'
        },
        { status: 400 }
      );
    }

    console.log('Processing Showbox episodes request for ID:', id);

    // Just fucking run the febbox API
    const febboxUrl = `https://www.febbox.com/file/file_share_list?share_key=${id}&is_html=0`;
    console.log('Fetching from:', febboxUrl);

    const response = await fetch(febboxUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Febbox response:', data);

    return NextResponse.json<ShowboxEpisodeResponse>({
      success: true,
      data: data,
      remainingRequests: authResult.apiKey ? (authResult.apiKey.requestsLimit - authResult.apiKey.requestsUsed) : 0
    });

  } catch (error: unknown) {
    console.error('Showbox episodes API error:', error);
    
    return NextResponse.json<ShowboxEpisodeResponse>(
      { 
        success: false, 
        error: 'Failed to fetch episode links',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
