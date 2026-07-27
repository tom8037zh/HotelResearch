"use client";

import { useActionState } from "react";
import type { HotelFormState } from "./actions";

interface HotelFormProps {
  action: (prevState: HotelFormState, formData: FormData) => Promise<HotelFormState>;
  defaultValues?: {
    name: string;
    googleMapsUrl: string;
    tripadvisorUrl: string;
    bookingUrl: string;
    notes: string;
  };
  submitLabel: string;
}

export function HotelForm({ action, defaultValues, submitLabel }: HotelFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-black dark:text-zinc-50" htmlFor="name">
          Hotel
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
          htmlFor="googleMapsUrl"
        >
          Link zu Google Maps
        </label>
        <input
          id="googleMapsUrl"
          name="googleMapsUrl"
          type="url"
          required
          defaultValue={defaultValues?.googleMapsUrl}
          placeholder="https://www.google.com/maps/place/..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
          htmlFor="tripadvisorUrl"
        >
          Link zu TripAdvisor (optional)
        </label>
        <input
          id="tripadvisorUrl"
          name="tripadvisorUrl"
          type="url"
          defaultValue={defaultValues?.tripadvisorUrl}
          placeholder="https://www.tripadvisor.com/Hotel_Review-..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
          htmlFor="bookingUrl"
        >
          Link zu Booking.com (optional)
        </label>
        <input
          id="bookingUrl"
          name="bookingUrl"
          type="url"
          defaultValue={defaultValues?.bookingUrl}
          placeholder="https://www.booking.com/hotel/..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-black dark:text-zinc-50" htmlFor="notes">
          Bemerkungen
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={defaultValues?.notes}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {isPending ? "Rating wird abgerufen, das kann etwas dauern…" : submitLabel}
      </button>
    </form>
  );
}
