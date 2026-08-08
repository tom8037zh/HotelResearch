import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HotelsTable, type HotelRow } from "../HotelsTable";

export const dynamic = "force-dynamic";

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const id = Number(tripId);

  // `photo` (Bytes) bewusst nicht mitselektieren, sonst würden hier alle Hotel-Fotos komplett
  // übertragen nur um sie anzuzeigen - stattdessen den (leichtgewichtigen) photoType als
  // "hat Foto?"-Indikator nutzen, die eigentlichen Bytes kommen über die Foto-Route.
  const trip = Number.isFinite(id)
    ? await prisma.trip.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          hotels: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              website: true,
              notes: true,
              status: true,
              sortOrder: true,
              latitude: true,
              longitude: true,
              photoType: true,
              updatedAt: true,
              ratings: true,
            },
          },
        },
      })
    : null;

  if (!trip) {
    notFound();
  }

  const hotels: HotelRow[] = trip.hotels.map((hotel) => {
    const google = hotel.ratings.find((r) => r.source === "GOOGLE");
    const tripadvisor = hotel.ratings.find((r) => r.source === "TRIPADVISOR");
    const booking = hotel.ratings.find((r) => r.source === "BOOKING");
    return {
      id: hotel.id,
      name: hotel.name,
      website: hotel.website,
      notes: hotel.notes,
      status: hotel.status,
      sortOrder: hotel.sortOrder,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      photoVersion: hotel.photoType !== null ? hotel.updatedAt.getTime() : null,
      google: google ? { url: google.url, rating: google.rating, reviewsCount: google.reviewsCount } : null,
      tripadvisor: tripadvisor
        ? { url: tripadvisor.url, rating: tripadvisor.rating, reviewsCount: tripadvisor.reviewsCount }
        : null,
      booking: booking ? { url: booking.url, rating: booking.rating, reviewsCount: booking.reviewsCount } : null,
    };
  });

  return (
    <div className="min-h-screen bg-page px-4 py-6 font-sans text-text-primary md:px-8 md:py-10">
      <main className="mx-auto max-w-[1240px]">
        <Link href="/" className="mb-4 inline-block text-[13px] text-text-secondary">
          ← Alle Reisen
        </Link>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-text-primary">{trip.name}</h1>
            <p className="text-[13px] text-text-secondary">
              {hotels.length} {hotels.length === 1 ? "Hotel" : "Hotels"}
            </p>
          </div>
          <Link
            href={`/trips/${trip.id}/hotels/new`}
            className="rounded-lg bg-text-primary px-[18px] py-2.5 text-center text-sm font-medium text-white"
          >
            + Neues Hotel
          </Link>
        </div>

        <HotelsTable tripId={trip.id} hotels={hotels} />
      </main>
    </div>
  );
}
