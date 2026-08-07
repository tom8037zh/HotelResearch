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
      ? await prisma.hotel.findUnique({
          where: { id: hotelIdNum },
          omit: { photo: true },
          include: { ratings: true, trip: true },
        })
      : null;

  if (!hotel || hotel.tripId !== tripIdNum) {
    notFound();
  }

  const googleMapsUrl = hotel.ratings.find((r) => r.source === "GOOGLE")?.url ?? "";
  const tripadvisorUrl = hotel.ratings.find((r) => r.source === "TRIPADVISOR")?.url ?? "";
  const bookingUrl = hotel.ratings.find((r) => r.source === "BOOKING")?.url ?? "";

  return (
    <div className="min-h-screen bg-page px-8 py-10 font-sans text-text-primary">
      <main className="mx-auto max-w-[520px]">
        <Link href={`/trips/${hotel.tripId}`} className="mb-4 inline-block text-[13px] text-text-secondary">
          ← Zurück zu {hotel.trip.name}
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Hotel bearbeiten</h1>
        <HotelForm
          action={updateHotel.bind(null, hotel.id)}
          defaultValues={{
            name: hotel.name,
            googleMapsUrl,
            tripadvisorUrl,
            bookingUrl,
            notes: hotel.notes ?? "",
            photoSource: hotel.photoSource ?? "",
          }}
          photoUrl={hotel.photoType ? `/api/hotels/${hotel.id}/photo?v=${hotel.updatedAt.getTime()}` : undefined}
          submitLabel="Speichern"
        />
      </main>
    </div>
  );
}
