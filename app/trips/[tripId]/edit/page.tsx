import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateTrip } from "../../actions";
import { TripForm } from "../../TripForm";

function toDateInputValue(date: Date | null): string | undefined {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export default async function EditTripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const id = Number(tripId);
  const trip = Number.isFinite(id)
    ? await prisma.trip.findUnique({ where: { id }, omit: { coverPhoto: true } })
    : null;

  if (!trip) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-page px-8 py-10 font-sans text-text-primary">
      <main className="mx-auto max-w-[520px]">
        <Link href="/" className="mb-4 inline-block text-[13px] text-text-secondary">
          ← Zurück
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Reise bearbeiten</h1>
        <TripForm
          action={updateTrip.bind(null, trip.id)}
          defaultValues={{
            name: trip.name,
            startDate: toDateInputValue(trip.startDate),
            endDate: toDateInputValue(trip.endDate),
          }}
          photoUrl={trip.coverPhotoType ? `/api/trips/${trip.id}/photo?v=${trip.updatedAt.getTime()}` : undefined}
          submitLabel="Speichern"
        />
      </main>
    </div>
  );
}
