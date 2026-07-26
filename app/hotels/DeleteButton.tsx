"use client";

import { deleteHotel } from "./actions";

export function DeleteButton({ id, hotelName }: { id: number; hotelName: string }) {
  return (
    <form
      action={deleteHotel.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`"${hotelName}" wirklich löschen?`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm text-red-600 hover:underline dark:text-red-400">
        Löschen
      </button>
    </form>
  );
}
