"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  fetchBookingRating,
  fetchGoogleMapsRating,
  fetchTripAdvisorRating,
  isBookingUrl,
  isGoogleMapsUrl,
  isTripAdvisorUrl,
  type PlaceRating,
} from "@/lib/apify";
import { downloadImage, readPhotoFromForm, type PhotoData } from "@/lib/upload";

export interface HotelFormState {
  error?: string;
}

type PhotoSourceField = "" | "UPLOAD" | "GOOGLE";
type HotelStatusField = "" | "PRIORITIZED" | "BOOKED" | "DISCARDED";

function readHotelForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
    googleMapsUrl: String(formData.get("googleMapsUrl") ?? "").trim(),
    tripadvisorUrl: String(formData.get("tripadvisorUrl") ?? "").trim(),
    bookingUrl: String(formData.get("bookingUrl") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

function readStatusField(formData: FormData): HotelStatusField {
  const value = String(formData.get("status") ?? "");
  return value === "PRIORITIZED" || value === "BOOKED" || value === "DISCARDED" ? value : "";
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function readPhotoSourceField(formData: FormData): PhotoSourceField {
  const value = String(formData.get("photoSource") ?? "");
  return value === "UPLOAD" || value === "GOOGLE" ? value : "";
}

export async function createHotel(
  tripId: number,
  _prevState: HotelFormState,
  formData: FormData
): Promise<HotelFormState> {
  const { name, website, googleMapsUrl, tripadvisorUrl, bookingUrl, notes } = readHotelForm(formData);
  const photoSource = readPhotoSourceField(formData);
  const status = readStatusField(formData);

  if (!name) {
    return { error: "Bitte einen Hotelnamen angeben." };
  }
  if (website && !isValidUrl(website)) {
    return { error: "Bitte eine gültige Website-URL angeben." };
  }
  if (!googleMapsUrl || !isGoogleMapsUrl(googleMapsUrl)) {
    return { error: "Bitte einen gültigen Google-Maps-Link angeben." };
  }
  if (tripadvisorUrl && !isTripAdvisorUrl(tripadvisorUrl)) {
    return { error: "Bitte einen gültigen TripAdvisor-Link angeben." };
  }
  if (bookingUrl && !isBookingUrl(bookingUrl)) {
    return { error: "Bitte einen gültigen Booking.com-Link angeben." };
  }

  // Neues Hotel wird ans Ende der (per Drag-and-Drop editierbaren) Reihenfolge angehängt.
  const { _max } = await prisma.hotel.aggregate({ where: { tripId }, _max: { sortOrder: true } });
  const sortOrder = (_max.sortOrder ?? -1) + 1;

  const [googleRating, tripadvisorRating, bookingRating] = await Promise.all([
    fetchGoogleMapsRating(googleMapsUrl),
    tripadvisorUrl ? fetchTripAdvisorRating(tripadvisorUrl) : Promise.resolve(null),
    bookingUrl ? fetchBookingRating(bookingUrl) : Promise.resolve(null),
  ]);

  let photo: PhotoData | null = null;
  if (photoSource === "UPLOAD") {
    try {
      photo = await readPhotoFromForm(formData, "photo");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Foto konnte nicht verarbeitet werden." };
    }
    if (!photo) {
      return { error: "Bitte eine Datei auswählen." };
    }
  } else if (photoSource === "GOOGLE" && googleRating?.imageUrl) {
    photo = await downloadImage(googleRating.imageUrl);
  }

  await prisma.hotel.create({
    data: {
      tripId,
      name,
      website: website || null,
      notes: notes || null,
      status: status || null,
      sortOrder,
      latitude: googleRating?.latitude ?? null,
      longitude: googleRating?.longitude ?? null,
      photo: photo?.bytes,
      photoType: photo?.type,
      photoSource: photoSource || null,
      ratings: {
        create: [
          {
            source: "GOOGLE",
            url: googleMapsUrl,
            rating: googleRating?.rating ?? null,
            reviewsCount: googleRating?.reviewsCount ?? null,
          },
          ...(tripadvisorUrl
            ? [
                {
                  source: "TRIPADVISOR" as const,
                  url: tripadvisorUrl,
                  rating: tripadvisorRating?.rating ?? null,
                  reviewsCount: tripadvisorRating?.reviewsCount ?? null,
                },
              ]
            : []),
          ...(bookingUrl
            ? [
                {
                  source: "BOOKING" as const,
                  url: bookingUrl,
                  rating: bookingRating?.rating ?? null,
                  reviewsCount: bookingRating?.reviewsCount ?? null,
                },
              ]
            : []),
        ],
      },
    },
  });

  revalidatePath("/");
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function updateHotel(
  id: number,
  _prevState: HotelFormState,
  formData: FormData
): Promise<HotelFormState> {
  const { name, website, googleMapsUrl, tripadvisorUrl, bookingUrl, notes } = readHotelForm(formData);
  const photoSource = readPhotoSourceField(formData);
  const status = readStatusField(formData);

  if (!name) {
    return { error: "Bitte einen Hotelnamen angeben." };
  }
  if (website && !isValidUrl(website)) {
    return { error: "Bitte eine gültige Website-URL angeben." };
  }
  if (!googleMapsUrl || !isGoogleMapsUrl(googleMapsUrl)) {
    return { error: "Bitte einen gültigen Google-Maps-Link angeben." };
  }
  if (tripadvisorUrl && !isTripAdvisorUrl(tripadvisorUrl)) {
    return { error: "Bitte einen gültigen TripAdvisor-Link angeben." };
  }
  if (bookingUrl && !isBookingUrl(bookingUrl)) {
    return { error: "Bitte einen gültigen Booking.com-Link angeben." };
  }

  const existing = await prisma.hotel.findUnique({
    where: { id },
    omit: { photo: true },
    include: { ratings: true },
  });
  if (!existing) {
    return { error: "Hotel wurde nicht gefunden." };
  }

  const existingGoogle = existing.ratings.find((r) => r.source === "GOOGLE");
  const existingTripAdvisor = existing.ratings.find((r) => r.source === "TRIPADVISOR");
  const existingBooking = existing.ratings.find((r) => r.source === "BOOKING");

  const googleChanged = googleMapsUrl !== existingGoogle?.url;
  const tripadvisorChanged = tripadvisorUrl !== (existingTripAdvisor?.url ?? "");
  const bookingChanged = bookingUrl !== (existingBooking?.url ?? "");

  const [googleFetched, tripadvisorFetched, bookingFetched] = await Promise.all([
    googleChanged ? fetchGoogleMapsRating(googleMapsUrl) : null,
    tripadvisorChanged && tripadvisorUrl ? fetchTripAdvisorRating(tripadvisorUrl) : null,
    bookingChanged && bookingUrl ? fetchBookingRating(bookingUrl) : null,
  ]);

  // Foto auflösen. Grundprinzip (analog zum Soft-Fail-Verhalten der Ratings): ein fehlgeschlagener
  // Download überschreibt nie ein bereits vorhandenes Foto - nur eine explizite Nutzerentscheidung
  // ("Kein Foto" wählen) löscht es.
  let photoUpdate:
    | {
        photo: Uint8Array<ArrayBuffer> | null;
        photoType: string | null;
        photoSource: Exclude<PhotoSourceField, ""> | null;
      }
    | null = null;

  if (photoSource === "") {
    photoUpdate = { photo: null, photoType: null, photoSource: null };
  } else if (photoSource === "UPLOAD") {
    let uploaded: PhotoData | null;
    try {
      uploaded = await readPhotoFromForm(formData, "photo");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Foto konnte nicht verarbeitet werden." };
    }
    if (uploaded) {
      photoUpdate = { photo: uploaded.bytes, photoType: uploaded.type, photoSource: "UPLOAD" };
    } else if (existing.photoSource !== "UPLOAD" || !existing.photoType) {
      return { error: "Bitte eine Datei auswählen." };
    }
    // sonst: bereits ein Upload-Foto vorhanden und keine neue Datei gewählt -> unverändert lassen.
  } else if (photoSource === "GOOGLE") {
    const needsFreshFetch = googleChanged || existing.photoSource !== "GOOGLE";
    if (needsFreshFetch) {
      const googleForPhoto: PlaceRating | null = googleChanged
        ? googleFetched
        : await fetchGoogleMapsRating(googleMapsUrl);
      if (googleForPhoto?.imageUrl) {
        const downloaded = await downloadImage(googleForPhoto.imageUrl);
        if (downloaded) {
          photoUpdate = { photo: downloaded.bytes, photoType: downloaded.type, photoSource: "GOOGLE" };
        }
      }
      // Download fehlgeschlagen oder kein imageUrl -> photoUpdate bleibt null, bestehendes Foto (falls
      // vorhanden) bleibt unangetastet.
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.hotel.update({
      where: { id },
      data: {
        name,
        website: website || null,
        notes: notes || null,
        status: status || null,
        ...(googleChanged
          ? {
              latitude: googleFetched?.latitude ?? null,
              longitude: googleFetched?.longitude ?? null,
            }
          : {}),
        ...(photoUpdate ?? {}),
      },
    });

    if (googleChanged) {
      await tx.rating.upsert({
        where: { hotelId_source: { hotelId: id, source: "GOOGLE" } },
        create: {
          hotelId: id,
          source: "GOOGLE",
          url: googleMapsUrl,
          rating: googleFetched?.rating ?? null,
          reviewsCount: googleFetched?.reviewsCount ?? null,
        },
        update: {
          url: googleMapsUrl,
          rating: googleFetched?.rating ?? null,
          reviewsCount: googleFetched?.reviewsCount ?? null,
        },
      });
    }

    if (tripadvisorUrl) {
      if (tripadvisorChanged) {
        await tx.rating.upsert({
          where: { hotelId_source: { hotelId: id, source: "TRIPADVISOR" } },
          create: {
            hotelId: id,
            source: "TRIPADVISOR",
            url: tripadvisorUrl,
            rating: tripadvisorFetched?.rating ?? null,
            reviewsCount: tripadvisorFetched?.reviewsCount ?? null,
          },
          update: {
            url: tripadvisorUrl,
            rating: tripadvisorFetched?.rating ?? null,
            reviewsCount: tripadvisorFetched?.reviewsCount ?? null,
          },
        });
      }
    } else if (existingTripAdvisor) {
      await tx.rating.delete({
        where: { hotelId_source: { hotelId: id, source: "TRIPADVISOR" } },
      });
    }

    if (bookingUrl) {
      if (bookingChanged) {
        await tx.rating.upsert({
          where: { hotelId_source: { hotelId: id, source: "BOOKING" } },
          create: {
            hotelId: id,
            source: "BOOKING",
            url: bookingUrl,
            rating: bookingFetched?.rating ?? null,
            reviewsCount: bookingFetched?.reviewsCount ?? null,
          },
          update: {
            url: bookingUrl,
            rating: bookingFetched?.rating ?? null,
            reviewsCount: bookingFetched?.reviewsCount ?? null,
          },
        });
      }
    } else if (existingBooking) {
      await tx.rating.delete({
        where: { hotelId_source: { hotelId: id, source: "BOOKING" } },
      });
    }
  });

  revalidatePath("/");
  revalidatePath(`/trips/${existing.tripId}`);
  redirect(`/trips/${existing.tripId}`);
}

export async function deleteHotel(id: number): Promise<void> {
  const existing = await prisma.hotel.findUnique({ where: { id } });
  if (!existing) return;

  await prisma.hotel.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath(`/trips/${existing.tripId}`);
}

/**
 * Speichert eine per Drag-and-Drop erstellte manuelle Hotel-Reihenfolge. Wird direkt aus einer Client-
 * Komponente aufgerufen (kein Formular). `orderedIds` muss exakt die Menge der Hotel-IDs der Reise sein -
 * bei Abweichung (z.B. veralteter Client-Zustand) wird still nichts geändert statt teilweise zu schreiben.
 */
export async function reorderHotels(tripId: number, orderedIds: number[]): Promise<void> {
  const existing = await prisma.hotel.findMany({ where: { tripId }, select: { id: true } });
  const existingIds = new Set(existing.map((h) => h.id));

  const isValidPermutation =
    orderedIds.length === existingIds.size && orderedIds.every((id) => existingIds.has(id));
  if (!isValidPermutation) return;

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.hotel.update({ where: { id }, data: { sortOrder: index } }))
  );

  revalidatePath(`/trips/${tripId}`);
}
