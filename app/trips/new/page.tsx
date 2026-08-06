import Link from "next/link";
import { createTrip } from "../actions";
import { TripForm } from "../TripForm";

export default function NewTripPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="mx-auto max-w-xl">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Zurück
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">Neue Reise</h1>
        <TripForm action={createTrip} submitLabel="Speichern" />
      </main>
    </div>
  );
}
