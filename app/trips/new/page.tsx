import Link from "next/link";
import { createTrip } from "../actions";
import { TripForm } from "../TripForm";

export default function NewTripPage() {
  return (
    <div className="min-h-screen bg-page px-8 py-10 font-sans text-text-primary">
      <main className="mx-auto max-w-[520px]">
        <Link href="/" className="mb-4 inline-block text-[13px] text-text-secondary">
          ← Zurück
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Neue Reise</h1>
        <TripForm action={createTrip} submitLabel="Speichern" />
      </main>
    </div>
  );
}
