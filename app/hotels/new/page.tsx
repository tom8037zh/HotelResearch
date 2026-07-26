import Link from "next/link";
import { createHotel } from "../actions";
import { HotelForm } from "../HotelForm";

export default function NewHotelPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="mx-auto max-w-xl">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Zurück
        </Link>
        <h1 className="mb-6 text-2xl font-semibold text-black dark:text-zinc-50">Neues Hotel</h1>
        <HotelForm action={createHotel} submitLabel="Speichern" />
      </main>
    </div>
  );
}
