import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateHotel } from "../../actions";
import { HotelForm } from "../../HotelForm";

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hotelId = Number(id);
  const hotel = Number.isFinite(hotelId)
    ? await prisma.hotel.findUnique({ where: { id: hotelId }, include: { ratings: true } })
    : null;

  if (!hotel) {
    notFound();
  }

  const googleMapsUrl = hotel.ratings.find((r) => r.source === "GOOGLE")?.url ?? "";
  const tripadvisorUrl = hotel.ratings.find((r) => r.source === "TRIPADVISOR")?.url ?? "";
  const bookingUrl = hotel.ratings.find((r) => r.source === "BOOKING")?.url ?? "";

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="mx-auto max-w-xl">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Zurück
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
