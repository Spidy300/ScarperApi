import { NextResponse } from 'next/server';
import { getStream } from '@/lib/consumet'; // Keep existing imports

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Query parameter 'id' is required" }, { status: 400 });
    }

    // --- LOCKED REMOVED: No API key check here anymore ---

    const data = await getStream(id);
    return NextResponse.json(data);

  } catch (error) {
    console.error("Stream Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
