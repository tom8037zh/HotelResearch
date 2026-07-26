import { NextRequest, NextResponse } from "next/server";
import { fetchGoogleMapsRating, isGoogleMapsUrl } from "@/lib/apify";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "Bitte einen Google-Maps-Link angeben." }, { status: 400 });
  }

  if (!isGoogleMapsUrl(url)) {
    return NextResponse.json({ error: "Bitte einen Google-Maps-Link angeben." }, { status: 400 });
  }

  if (!process.env.APIFY_API_TOKEN) {
    return NextResponse.json(
      { error: "Server ist nicht konfiguriert: APIFY_API_TOKEN fehlt in .env.local." },
      { status: 500 }
    );
  }

  const result = await fetchGoogleMapsRating(url);

  if (!result) {
    return NextResponse.json(
      { error: "Für diesen Link konnte kein Ort gefunden werden." },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
