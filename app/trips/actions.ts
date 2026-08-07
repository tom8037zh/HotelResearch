"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { readPhotoFromForm } from "@/lib/upload";

export interface TripFormState {
  error?: string;
}

function parseFormDate(value: FormDataEntryValue | null): Date | null {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const date = new Date(`${str}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Liest Start-/Enddatum aus dem Formular. Beide leer -> kein Zeitraum (kein Fehler, Feld ist
 * optional). Nur eines gesetzt, oder Ende vor Start -> Fehlermeldung.
 */
function readDateRange(formData: FormData): { startDate: Date | null; endDate: Date | null } | { error: string } {
  const startDate = parseFormDate(formData.get("startDate"));
  const endDate = parseFormDate(formData.get("endDate"));

  if (!startDate && !endDate) {
    return { startDate: null, endDate: null };
  }
  if (!startDate || !endDate) {
    return { error: "Bitte Start- und Enddatum beide angeben oder beide leer lassen." };
  }
  if (endDate < startDate) {
    return { error: "Das Enddatum darf nicht vor dem Startdatum liegen." };
  }
  return { startDate, endDate };
}

export async function createTrip(
  _prevState: TripFormState,
  formData: FormData
): Promise<TripFormState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Bitte einen Namen für die Reise angeben." };
  }

  const dateRange = readDateRange(formData);
  if ("error" in dateRange) {
    return { error: dateRange.error };
  }

  let photo;
  try {
    photo = await readPhotoFromForm(formData, "photo");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Foto konnte nicht verarbeitet werden." };
  }

  await prisma.trip.create({
    data: {
      name,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      coverPhoto: photo?.bytes,
      coverPhotoType: photo?.type,
    },
  });

  revalidatePath("/");
  redirect("/");
}

export async function updateTrip(
  id: number,
  _prevState: TripFormState,
  formData: FormData
): Promise<TripFormState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Bitte einen Namen für die Reise angeben." };
  }

  const dateRange = readDateRange(formData);
  if ("error" in dateRange) {
    return { error: dateRange.error };
  }

  const existing = await prisma.trip.findUnique({ where: { id }, omit: { coverPhoto: true } });
  if (!existing) {
    return { error: "Reise wurde nicht gefunden." };
  }

  let photo;
  try {
    photo = await readPhotoFromForm(formData, "photo");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Foto konnte nicht verarbeitet werden." };
  }

  const removePhoto = formData.get("removePhoto") === "on";

  await prisma.trip.update({
    where: { id },
    data: {
      name,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      ...(photo
        ? { coverPhoto: photo.bytes, coverPhotoType: photo.type }
        : removePhoto
          ? { coverPhoto: null, coverPhotoType: null }
          : {}),
    },
  });

  revalidatePath("/");
  revalidatePath(`/trips/${id}`);
  redirect("/");
}

export async function deleteTrip(id: number): Promise<void> {
  await prisma.trip.delete({ where: { id } });
  revalidatePath("/");
}
