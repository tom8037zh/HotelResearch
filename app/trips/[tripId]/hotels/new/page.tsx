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
    <div className="min-h-screen bg-page px-4 py-6 font-sans text-text-primary md:px-8 md:py-10">
      <main className="mx-auto max-w-[520px]">
        <Link href={`/trips/${trip.id}`} className="mb-4 inline-block text-[13px] text-text-secondary">
          ← Zurück zu {trip.name}
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Neues Hotel</h1>
        <HotelForm action={createHotel.bind(null, trip.id)} submitLabel="Speichern" />
      </main>
    </div>
  );
}
