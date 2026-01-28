import { NextResponse } from "next/server";

const STATIC_COOKIE = "__ddgid_=GIsAbopI81hATr14; __ddgmark_=PZvu2hO7knFJVjvc; __ddg2_=wxrBAhJcnT8W4igZ; __ddg1_=ytxmCXeUPhCjALFThP2b; res=720; aud=jpn; av1=0; latest=6302; __ddg9_=152.59.146.5; XSRF-TOKEN=eyJpdiI6InUxMU9tRXJHWmUzZG4ySVZSTEo2Q2c9PSIsInZhbHVlIjoiWXlsbnNlcU8wdlZOdXY1ZUk3WWtpeExGWlZBUkw1UmtBNldBUURpL0NLMXlOT1RqcW5QczFZRVhSakkzR3lSeHM5cGFPUUJWVm1QWktZemJ6dnlKeXZmUnhvSnhZVmhqWTdkamNmT3JScWEvRFUvSXVELzhMOStubVplUjlSQTgiLCJtYWMiOiI2Mjg5NzgwZGY3MmExYmQ5YmZjOTUxOGY3ZjhjMDE0MWUxYjg3OTc0YjQyNTQwMTk0MzUzYTYzOGUzNDU5MTA0IiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6Im5wQmdwL3cwZGxrZjNNTTRUdUJBMGc9PSIsInZhbHVlIjoiQzZkUFgxS2R0NmpZT3dEanVOWnlWOHliMUhLOEVNZFdiRnBXcytvVDBKVVYwYTJMTGNoOVhkNGlOb3hrMHBoQTVQYXlHdEprZU92b2Vmd1MvcVZRTDM3LzVmOGpkU0xKbjdwM3lhc05hN3FUWXVZMUVmSEhoc2liVjh6ekRHM1ciLCJtYWMiOiIwNzNmZmVkYTRlZmNhNzliODM5MjE2ZTc1YjQ4OWVlZDgzYjMyNjkzM2FkOWZkZjM1OTU2YjUwMmIwNzNmZDQ3IiwidGFnIjoiIn0%3D; __ddg8_=6gyCmeFPr6iPnCeE; __ddg10_=1769621927; ann-fakesite=0";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "query parameter is required",
        },
        { status: 400 }
      );
    }

    const apiUrl = `https://animepahe.si/api?m=search&q=${encodeURIComponent(query)}`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Cookie: STATIC_COOKIE,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error searching animepahe:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search",
      },
      { status: 500 }
    );
  }
}
