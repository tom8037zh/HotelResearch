import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "./hotels/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const hotels = await prisma.hotel.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Hotels</h1>
          <Link
            href="/hotels/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            + Neues Hotel
          </Link>
        </div>

        {hotels.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">Noch keine Hotels angelegt.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {hotels.map((hotel) => (
              <li
                key={hotel.id}
                className="rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-black dark:text-zinc-50">{hotel.name}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {hotel.rating !== null
                        ? `★ ${hotel.rating} (${hotel.reviewsCount ?? 0} Bewertungen)`
                        : "kein Rating"}
                    </p>
                    {hotel.notes && (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">{hotel.notes}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <Link
                      href={`/hotels/${hotel.id}/edit`}
                      className="text-sm text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      Bearbeiten
                    </Link>
                    <DeleteButton id={hotel.id} hotelName={hotel.name} />
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
