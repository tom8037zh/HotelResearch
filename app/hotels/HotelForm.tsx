"use client";

import { useActionState } from "react";
import type { HotelFormState } from "./actions";
import { PhotoSourceField, type PhotoSourceValue } from "./PhotoSourceField";

interface HotelFormProps {
  action: (prevState: HotelFormState, formData: FormData) => Promise<HotelFormState>;
  defaultValues?: {
    name: string;
    googleMapsUrl: string;
    tripadvisorUrl: string;
    bookingUrl: string;
    notes: string;
    photoSource?: PhotoSourceValue;
  };
  /** Nur gesetzt, wenn das bestehende Hotel bereits ein Foto hat (Edit-Fall). */
  photoUrl?: string;
  submitLabel: string;
}

const inputClasses =
  "w-full rounded-lg border border-card-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-text-muted focus:outline-none";

export function HotelForm({ action, defaultValues, photoUrl, submitLabel }: HotelFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="rounded-[14px] border border-card-border bg-white p-7">
      <div className="mb-5 flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="name">
          Hotel
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder="Hotelname"
          className={inputClasses}
        />
      </div>

      <div className="mb-5 flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="googleMapsUrl">
          Link zu Google Maps
        </label>
        <input
          id="googleMapsUrl"
          name="googleMapsUrl"
          type="url"
          required
          defaultValue={defaultValues?.googleMapsUrl}
          placeholder="https://www.google.com/maps/place/..."
          className={inputClasses}
        />
      </div>

      <div className="mb-5 flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="tripadvisorUrl">
          Link zu TripAdvisor <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <input
          id="tripadvisorUrl"
          name="tripadvisorUrl"
          type="url"
          defaultValue={defaultValues?.tripadvisorUrl}
          placeholder="https://www.tripadvisor.com/Hotel_Review-..."
          className={inputClasses}
        />
      </div>

      <div className="mb-5 flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="bookingUrl">
          Link zu Booking.com <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <input
          id="bookingUrl"
          name="bookingUrl"
          type="url"
          defaultValue={defaultValues?.bookingUrl}
          placeholder="https://www.booking.com/hotel/..."
          className={inputClasses}
        />
      </div>

      <div className="mb-6 flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="notes">
          Bemerkungen
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={8}
          defaultValue={defaultValues?.notes}
          className={`${inputClasses} resize-y`}
        />
      </div>

      <PhotoSourceField defaultValue={defaultValues?.photoSource ?? ""} photoUrl={photoUrl} />

      {state.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-text-primary px-[18px] py-[11px] text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Rating wird abgerufen, das kann etwas dauern…" : submitLabel}
      </button>
    </form>
  );
}
