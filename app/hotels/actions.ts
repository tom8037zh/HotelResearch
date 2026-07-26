"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchGoogleMapsRating, isGoogleMapsUrl } from "@/lib/apify";

export interface HotelFormState {
  error?: string;
}

function readHotelForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    googleMapsUrl: String(formData.get("googleMapsUrl") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

export async function createHotel(
  _prevState: HotelFormState,
  formData: FormData
): Promise<HotelFormState> {
  const { name, googleMapsUrl, notes } = readHotelForm(formData);

  if (!name) {
    return { error: "Bitte einen Hotelnamen angeben." };
  }
  if (!googleMapsUrl || !isGoogleMapsUrl(googleMapsUrl)) {
    return { error: "Bitte einen gültigen Google-Maps-Link angeben." };
  }

  const rating = await fetchGoogleMapsRating(googleMapsUrl);

  await prisma.hotel.create({
    data: {
      name,
      googleMapsUrl,
      notes: notes || null,
      rating: rating?.rating ?? null,
      reviewsCount: rating?.reviewsCount ?? null,
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
  const { name, googleMapsUrl, notes } = readHotelForm(formData);

  if (!name) {
    return { error: "Bitte einen Hotelnamen angeben." };
  }
  if (!googleMapsUrl || !isGoogleMapsUrl(googleMapsUrl)) {
    return { error: "Bitte einen gültigen Google-Maps-Link angeben." };
  }

  const existing = await prisma.hotel.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Hotel wurde nicht gefunden." };
  }

  let rating = existing.rating;
  let reviewsCount = existing.reviewsCount;
  if (googleMapsUrl !== existing.googleMapsUrl) {
    const fetched = await fetchGoogleMapsRating(googleMapsUrl);
    rating = fetched?.rating ?? null;
    reviewsCount = fetched?.reviewsCount ?? null;
  }

  await prisma.hotel.update({
    where: { id },
    data: { name, googleMapsUrl, notes: notes || null, rating, reviewsCount },
  });

  revalidatePath("/");
  redirect("/");
}

export async function deleteHotel(id: number): Promise<void> {
  await prisma.hotel.delete({ where: { id } });
  revalidatePath("/");
}
