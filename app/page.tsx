import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TripCard } from "@/app/trips/TripCard";
import { formatDateRange } from "@/lib/formatDateRange";

export const dynamic = "force-dynamic";

export default async function Home() {
  // coverPhoto (Bytes) bewusst nicht mitselektieren, sonst würden hier alle Titelbilder komplett
  // übertragen nur um sie anzuzeigen - stattdessen den (leichtgewichtigen) coverPhotoType als
  // "hat Foto?"-Indikator nutzen, die eigentlichen Bytes kommen über die Foto-Route.
  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      coverPhotoType: true,
      updatedAt: true,
      _count: { select: { hotels: true } },
    },
  });

  return (
    <div className="min-h-screen bg-page px-4 py-6 font-sans text-text-primary md:px-8 md:py-10">
      <main className="mx-auto max-w-[1240px]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-text-primary">Reisen</h1>
          <Link
            href="/trips/new"
            className="rounded-lg bg-text-primary px-[18px] py-2.5 text-center text-sm font-medium text-white"
          >
            + Neue Reise
          </Link>
        </div>

        {trips.length === 0 ? (
          <p className="text-text-secondary">Noch keine Reisen angelegt.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={{
                  id: trip.id,
                  name: trip.name,
                  hotelCount: trip._count.hotels,
                  photoVersion: trip.coverPhotoType !== null ? trip.updatedAt.getTime() : null,
                  dateRangeLabel: formatDateRange(trip.startDate, trip.endDate),
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
