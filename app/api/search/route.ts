import { NextResponse } from 'next/server';
import { search } from '@/lib/consumet'; // Keep existing imports

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    // --- LOCKED REMOVED: No API key check here anymore ---

    const data = await search(query);
    return NextResponse.json(data);

  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
