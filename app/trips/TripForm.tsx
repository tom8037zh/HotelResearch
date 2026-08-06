"use client";

import { useActionState } from "react";
import type { TripFormState } from "./actions";

interface TripFormProps {
  action: (prevState: TripFormState, formData: FormData) => Promise<TripFormState>;
  defaultValues?: { name: string };
  submitLabel: string;
}

export function TripForm({ action, defaultValues, submitLabel }: TripFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-black dark:text-zinc-50" htmlFor="name">
          Reise
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder="z.B. Sommerurlaub Griechenland 2026"
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
        {submitLabel}
      </button>
    </form>
  );
}
