export interface PlaceRating {
  name: string;
  rating: number | null;
  reviewsCount: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface ApifyPlaceResult {
  title?: string;
  totalScore?: number;
  reviewsCount?: number;
  location?: { lat?: number; lng?: number };
}

export function isGoogleMapsUrl(url: string): boolean {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }
  return (
    parsedUrl.hostname.includes("google.") ||
    parsedUrl.hostname === "goo.gl" ||
    parsedUrl.hostname.endsWith(".goo.gl")
  );
}

/**
 * Ruft Name/Rating/Anzahl Bewertungen für einen Google-Maps-Link über Apify ab.
 * Gibt bei jedem Fehler (Netzwerk, Apify-Fehler, kein Ort gefunden) null zurück statt zu werfen,
 * damit Aufrufer selbst entscheiden können, ob trotzdem gespeichert wird.
 */
export async function fetchGoogleMapsRating(url: string): Promise<PlaceRating | null> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    console.error("APIFY_API_TOKEN fehlt in der Umgebung.");
    return null;
  }

  try {
    // Dieser Actor liefert immer volle Review-Texte mit (kein Opt-out), daher maxReviews: 1 um die
    // Kosten zu minimieren - die Platz-Metadaten (title/totalScore/reviewsCount) hängen an jedem Review-Datensatz.
    const apifyRes = await fetch(
      "https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxReviews: 1,
        }),
      }
    );

    if (!apifyRes.ok) {
      console.error("Apify request failed:", apifyRes.status, await apifyRes.text());
      return null;
    }

    const results: ApifyPlaceResult[] = await apifyRes.json();
    const place = Array.isArray(results) ? results[0] : undefined;

    if (!place || !place.title) {
      return null;
    }

    return {
      name: place.title,
      rating: place.totalScore ?? null,
      reviewsCount: place.reviewsCount ?? null,
      latitude: place.location?.lat ?? null,
      longitude: place.location?.lng ?? null,
    };
  } catch (err) {
    console.error("Apify request failed:", err);
    return null;
  }
}

interface ApifyTripAdvisorResult {
  name?: string;
  rating?: number;
  numberOfReviews?: number;
}

export function isTripAdvisorUrl(url: string): boolean {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }
  return parsedUrl.hostname.includes("tripadvisor.");
}

/**
 * Ruft Name/Rating/Anzahl Bewertungen für einen TripAdvisor-Link über Apify ab.
 * Gibt bei jedem Fehler (Netzwerk, Apify-Fehler, kein Ort gefunden) null zurück statt zu werfen,
 * damit Aufrufer selbst entscheiden können, ob trotzdem gespeichert wird.
 */
export async function fetchTripAdvisorRating(url: string): Promise<PlaceRating | null> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    console.error("APIFY_API_TOKEN fehlt in der Umgebung.");
    return null;
  }

  try {
    const apifyRes = await fetch("https://api.apify.com/v2/acts/maxcopell~tripadvisor/run-sync-get-dataset-items", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxItemsPerQuery: 1,
      }),
    });

    if (!apifyRes.ok) {
      console.error("Apify request failed:", apifyRes.status, await apifyRes.text());
      return null;
    }

    const results: ApifyTripAdvisorResult[] = await apifyRes.json();
    const place = Array.isArray(results) ? results[0] : undefined;

    if (!place || !place.name) {
      return null;
    }

    return {
      name: place.name,
      rating: place.rating ?? null,
      reviewsCount: place.numberOfReviews ?? null,
    };
  } catch (err) {
    console.error("Apify request failed:", err);
    return null;
  }
}

interface ApifyBookingResult {
  name?: string;
  rating?: number;
  reviews?: number;
}

export function isBookingUrl(url: string): boolean {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }
  return parsedUrl.hostname.includes("booking.com");
}

/**
 * Ruft Name/Rating (10er-Skala)/Anzahl Bewertungen für einen Booking.com-Link über Apify ab.
 * Gibt bei jedem Fehler (Netzwerk, Apify-Fehler, kein Ort gefunden) null zurück statt zu werfen,
 * damit Aufrufer selbst entscheiden können, ob trotzdem gespeichert wird.
 */
export async function fetchBookingRating(url: string): Promise<PlaceRating | null> {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    console.error("APIFY_API_TOKEN fehlt in der Umgebung.");
    return null;
  }

  try {
    const apifyRes = await fetch("https://api.apify.com/v2/acts/voyager~booking-scraper/run-sync-get-dataset-items", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startUrls: [{ url }],
        maxItems: 1,
      }),
    });

    if (!apifyRes.ok) {
      console.error("Apify request failed:", apifyRes.status, await apifyRes.text());
      return null;
    }

    const results: ApifyBookingResult[] = await apifyRes.json();
    const place = Array.isArray(results) ? results[0] : undefined;

    if (!place || !place.name) {
      return null;
    }

    return {
      name: place.name,
      rating: place.rating ?? null,
      reviewsCount: place.reviews ?? null,
    };
  } catch (err) {
    console.error("Apify request failed:", err);
    return null;
  }
}
