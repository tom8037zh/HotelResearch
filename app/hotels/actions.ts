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
} from "@/lib/apify";

export interface HotelFormState {
  error?: string;
}

function readHotelForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    googleMapsUrl: String(formData.get("googleMapsUrl") ?? "").trim(),
    tripadvisorUrl: String(formData.get("tripadvisorUrl") ?? "").trim(),
    bookingUrl: String(formData.get("bookingUrl") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

export async function createHotel(
  _prevState: HotelFormState,
  formData: FormData
): Promise<HotelFormState> {
  const { name, googleMapsUrl, tripadvisorUrl, bookingUrl, notes } = readHotelForm(formData);

  if (!name) {
    return { error: "Bitte einen Hotelnamen angeben." };
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

  const [googleRating, tripadvisorRating, bookingRating] = await Promise.all([
    fetchGoogleMapsRating(googleMapsUrl),
    tripadvisorUrl ? fetchTripAdvisorRating(tripadvisorUrl) : Promise.resolve(null),
    bookingUrl ? fetchBookingRating(bookingUrl) : Promise.resolve(null),
  ]);

  await prisma.hotel.create({
    data: {
      name,
      notes: notes || null,
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
  redirect("/");
}

export async function updateHotel(
  id: number,
  _prevState: HotelFormState,
  formData: FormData
): Promise<HotelFormState> {
  const { name, googleMapsUrl, tripadvisorUrl, bookingUrl, notes } = readHotelForm(formData);

  if (!name) {
    return { error: "Bitte einen Hotelnamen angeben." };
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

  const existing = await prisma.hotel.findUnique({ where: { id }, include: { ratings: true } });
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

  await prisma.$transaction(async (tx) => {
    await tx.hotel.update({ where: { id }, data: { name, notes: notes || null } });

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
  redirect("/");
}

export async function deleteHotel(id: number): Promise<void> {
  await prisma.hotel.delete({ where: { id } });
  revalidatePath("/");
}
