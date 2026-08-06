import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ConfirmDeleteButton } from "@/app/components/ConfirmDeleteButton";
import { deleteTrip } from "@/app/trips/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { hotels: true } } },
  });

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Reisen</h1>
          <Link
            href="/trips/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            + Neue Reise
          </Link>
        </div>

        {trips.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">Noch keine Reisen angelegt.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {trips.map((trip) => (
              <li
                key={trip.id}
                className="rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/trips/${trip.id}`} className="flex-1">
                    <p className="font-medium text-black hover:underline dark:text-zinc-50">
                      {trip.name}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {trip._count.hotels} {trip._count.hotels === 1 ? "Hotel" : "Hotels"}
                    </p>
                  </Link>
                  <div className="flex shrink-0 gap-3">
                    <Link
                      href={`/trips/${trip.id}/edit`}
                      className="text-sm text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      Bearbeiten
                    </Link>
                    <ConfirmDeleteButton
                      action={deleteTrip.bind(null, trip.id)}
                      confirmMessage={`"${trip.name}" wirklich löschen? Damit werden auch alle ${trip._count.hotels} zugehörigen Hotels (inkl. Bewertungen) unwiderruflich gelöscht.`}
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
