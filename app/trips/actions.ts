"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface TripFormState {
  error?: string;
}

export async function createTrip(
  _prevState: TripFormState,
  formData: FormData
): Promise<TripFormState> {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Bitte einen Namen für die Reise angeben." };
  }

  await prisma.trip.create({ data: { name } });

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

  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Reise wurde nicht gefunden." };
  }

  await prisma.trip.update({ where: { id }, data: { name } });

  revalidatePath("/");
  revalidatePath(`/trips/${id}`);
  redirect("/");
}

export async function deleteTrip(id: number): Promise<void> {
  await prisma.trip.delete({ where: { id } });
  revalidatePath("/");
}
