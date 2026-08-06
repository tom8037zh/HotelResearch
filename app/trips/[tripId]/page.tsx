import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmDeleteButton } from "@/app/components/ConfirmDeleteButton";
import { deleteHotel } from "@/app/hotels/actions";

export const dynamic = "force-dynamic";

function RatingLine({
  label,
  rating,
  scale = 5,
}: {
  label: string;
  rating: { url: string; rating: number | null; reviewsCount: number | null } | undefined;
  scale?: 5 | 10;
}) {
  if (!rating) return null;

  const ratingText =
    rating.rating === null
      ? "kein Rating"
      : scale === 10
        ? `${rating.rating}/10 (${rating.reviewsCount ?? 0} Bewertungen)`
        : `★ ${rating.rating} (${rating.reviewsCount ?? 0} Bewertungen)`;

  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      <a
        href={rating.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline"
      >
        {label}
      </a>
      : {ratingText}
    </p>
  );
}

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const id = Number(tripId);
  const trip = Number.isFinite(id)
    ? await prisma.trip.findUnique({
        where: { id },
        include: { hotels: { orderBy: { createdAt: "desc" }, include: { ratings: true } } },
      })
    : null;

  if (!trip) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Alle Reisen
        </Link>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">{trip.name}</h1>
          <Link
            href={`/trips/${trip.id}/hotels/new`}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            + Neues Hotel
          </Link>
        </div>

        {trip.hotels.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">Noch keine Hotels für diese Reise angelegt.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {trip.hotels.map((hotel) => (
              <li
                key={hotel.id}
                className="rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-black dark:text-zinc-50">{hotel.name}</p>
                    <RatingLine
                      label="Google"
                      rating={hotel.ratings.find((r) => r.source === "GOOGLE")}
                    />
                    <RatingLine
                      label="TripAdvisor"
                      rating={hotel.ratings.find((r) => r.source === "TRIPADVISOR")}
                    />
                    <RatingLine
                      label="Booking.com"
                      rating={hotel.ratings.find((r) => r.source === "BOOKING")}
                      scale={10}
                    />
                    {hotel.notes && (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">{hotel.notes}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <Link
                      href={`/trips/${trip.id}/hotels/${hotel.id}/edit`}
                      className="text-sm text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      Bearbeiten
                    </Link>
                    <ConfirmDeleteButton
                      action={deleteHotel.bind(null, hotel.id)}
                      confirmMessage={`"${hotel.name}" wirklich löschen?`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
