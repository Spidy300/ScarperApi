import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const maxPages = parseInt(searchParams.get("maxPages") || "5");

    // Fetch data from pages 1 to maxPages
    const fetchPromises = [];
    for (let page = 1; page <= maxPages; page++) {
      fetchPromises.push(
        fetch(`https://animepahe.si/api?m=airing&page=${page}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Cookie": "__ddgid_=GIsAbopI81hATr14; __ddgmark_=PZvu2hO7knFJVjvc; __ddg2_=wxrBAhJcnT8W4igZ; __ddg1_=ytxmCXeUPhCjALFThP2b; res=720; aud=jpn; av1=0; latest=6441; __ddg9_=152.59.142.57; __ddg8_=egtCqGg0LH65LlEO; __ddg10_=1769617869; XSRF-TOKEN=eyJpdiI6IkdxdUo0aTJUYjg3eWUyc3l2cDFuaGc9PSIsInZhbHVlIjoiK1BLeEFySTJLdFV0c2pVVlJIMFp3a0Fqa0hSTlFyck9YeWY2all4WXVjd0J5UjM2SEFGdCtVZ1FyUjVyNGRjYkFLRWJRQzdONnZlMXZVZEs5YUVsaUdxRXhraFRUT2theVRDbEdLR2NkNHcyU1duRHFrejRCUjIyMEdKOWQ4cEwiLCJtYWMiOiI2OGZjZTBjNWRhZjUwMjJmODRkYjNkNThlMmI0M2Q2YWVmNGI0NGQwMmY0NDQ4ODNmMmQyZmM2NWExZDU2YzJkIiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6IklQekYvdGQ3QXdwK1oyeWNGdnkvR0E9PSIsInZhbHVlIjoicXNuSkZjZ0lVMWs1bXZRZmFJTmk0N2hoVDYxSHl3S1pQMmExLzdQRVYxUzhPeFUvTllkdXZOQkFCY3J3RW9Tb2FZM0hudGpKL25jTmNTaDhxWHdqbzVidE4vME9lODNXTlN1MmZjNFNZVVEwc25wL1IvYUVCQURNRk45dW56aVIiLCJtYWMiOiIzNWZmZjU5YjRiNzVhNzQ1Y2I5ZDkwNWNiMTdlODdiNjFmOTY2NjFhNjRmNjY5MGU0OTMyODRjNTJmMGZjYTA4IiwidGFnIjoiIn0%3D",
          },
        }).then((res) => res.json())
      );
    }

    const results = await Promise.all(fetchPromises);

    // Combine all data from different pages
    const combinedData = {
      total: results[0]?.total || 0,
      per_page: results[0]?.per_page || 0,
      pages_fetched: maxPages,
      last_page: results[0]?.last_page || 0,
      data: results.flatMap((result) => result.data || []),
    };

    return NextResponse.json({
      success: true,
      result: combinedData,
    });
  } catch (error) {
    console.error("Error fetching animepahe data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch data",
      },
      { status: 500 }
    );
  }
}
