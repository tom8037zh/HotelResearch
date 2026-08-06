import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createHotel } from "@/app/hotels/actions";
import { HotelForm } from "@/app/hotels/HotelForm";

export default async function NewHotelPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const id = Number(tripId);
  const trip = Number.isFinite(id) ? await prisma.trip.findUnique({ where: { id } }) : null;

  if (!trip) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="mx-auto max-w-xl">
        <Link
          href={`/trips/${trip.id}`}
          className="mb-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Zurück zu {trip.name}
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">Neues Hotel</h1>
        <HotelForm action={createHotel.bind(null, trip.id)} submitLabel="Speichern" />
      </main>
    </div>
  );
}
