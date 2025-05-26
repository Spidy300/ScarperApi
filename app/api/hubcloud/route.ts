import { NextResponse } from 'next/server'

interface StreamLink {
  server: string;
  link: string;
  type: string;
}

interface StreamResponse {
  links: StreamLink[];
  success: boolean;
  count: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL parameter is required'
      }, { status: 400 })
    }

    // Forward the request to the external API
    const response = await fetch(`https://kmmovies-ansh.8man.me/api/hubcloud?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: StreamResponse = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching stream links:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stream links'
    }, { status: 500 })
  }
}
