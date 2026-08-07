"use client";

import { useActionState } from "react";
import type { TripFormState } from "./actions";

interface TripFormProps {
  action: (prevState: TripFormState, formData: FormData) => Promise<TripFormState>;
  defaultValues?: { name: string; startDate?: string; endDate?: string };
  /** Nur gesetzt, wenn eine bestehende Reise bereits ein Titelbild hat (Edit-Fall). */
  photoUrl?: string;
  submitLabel: string;
}

const inputClasses =
  "w-full rounded-lg border border-card-border bg-white px-3 py-2.5 text-sm text-text-primary focus:border-text-muted focus:outline-none";

const fileInputClasses =
  "text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-row-divider file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary";

export function TripForm({ action, defaultValues, photoUrl, submitLabel }: TripFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="rounded-[14px] border border-card-border bg-white p-7">
      <div className="mb-5 flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="name">
          Reise
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder="z.B. Sommerurlaub Griechenland 2026"
          className={inputClasses}
        />
      </div>

      <div className="mb-5 flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-text-primary">
          Zeitraum <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <div className="flex gap-3">
          <input
            type="date"
            name="startDate"
            aria-label="Startdatum"
            defaultValue={defaultValues?.startDate}
            className={`${inputClasses} flex-1`}
          />
          <input
            type="date"
            name="endDate"
            aria-label="Enddatum"
            defaultValue={defaultValues?.endDate}
            className={`${inputClasses} flex-1`}
          />
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="photo">
          Titelbild <span className="font-normal text-text-muted">(optional)</span>
        </label>
        {photoUrl && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamische eigene API-Route, kein next/image nötig */}
            <img src={photoUrl} alt="" className="h-20 w-20 rounded-[10px] object-cover" />
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" name="removePhoto" className="h-4 w-4" />
              Foto entfernen
            </label>
          </div>
        )}
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={fileInputClasses} />
      </div>

      {state.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-text-primary px-[18px] py-[11px] text-sm font-medium text-white disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}
