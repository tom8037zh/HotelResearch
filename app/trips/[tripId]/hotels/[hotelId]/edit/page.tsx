import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateHotel } from "@/app/hotels/actions";
import { HotelForm } from "@/app/hotels/HotelForm";

export default async function EditHotelPage({
  params,
}: {
  params: Promise<{ tripId: string; hotelId: string }>;
}) {
  const { tripId, hotelId } = await params;
  const tripIdNum = Number(tripId);
  const hotelIdNum = Number(hotelId);

  const hotel =
    Number.isFinite(tripIdNum) && Number.isFinite(hotelIdNum)
      ? await prisma.hotel.findUnique({ where: { id: hotelIdNum }, include: { ratings: true, trip: true } })
      : null;

  if (!hotel || hotel.tripId !== tripIdNum) {
    notFound();
  }

  const googleMapsUrl = hotel.ratings.find((r) => r.source === "GOOGLE")?.url ?? "";
  const tripadvisorUrl = hotel.ratings.find((r) => r.source === "TRIPADVISOR")?.url ?? "";
  const bookingUrl = hotel.ratings.find((r) => r.source === "BOOKING")?.url ?? "";

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="mx-auto max-w-xl">
        <Link
          href={`/trips/${hotel.tripId}`}
          className="mb-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Zurück zu {hotel.trip.name}
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">Hotel bearbeiten</h1>
        <HotelForm
          action={updateHotel.bind(null, hotel.id)}
          defaultValues={{
            name: hotel.name,
            googleMapsUrl,
            tripadvisorUrl,
            bookingUrl,
            notes: hotel.notes ?? "",
          }}
          submitLabel="Speichern"
        />
      </main>
    </div>
  );
}
