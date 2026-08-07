"use client";

import { useState } from "react";

export type PhotoSourceValue = "" | "UPLOAD" | "GOOGLE";

const fileInputClasses =
  "text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-row-divider file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary";

/** Radio-Auswahl "Kein Foto" / "Eigenes Foto hochladen" / "Von Google Maps übernehmen" für HotelForm. */
export function PhotoSourceField({
  defaultValue = "",
  photoUrl,
}: {
  defaultValue?: PhotoSourceValue;
  photoUrl?: string;
}) {
  const [source, setSource] = useState<PhotoSourceValue>(defaultValue);

  return (
    <div className="mb-6 flex flex-col gap-2">
      <label className="text-[13px] font-medium text-text-primary">
        Foto <span className="font-normal text-text-muted">(optional)</span>
      </label>

      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- dynamische eigene API-Route, kein next/image nötig
        <img src={photoUrl} alt="" className="h-20 w-20 rounded-[10px] object-cover" />
      )}

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="radio"
            name="photoSource"
            value=""
            checked={source === ""}
            onChange={() => setSource("")}
            className="h-4 w-4"
          />
          Kein Foto
        </label>

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="radio"
            name="photoSource"
            value="UPLOAD"
            checked={source === "UPLOAD"}
            onChange={() => setSource("UPLOAD")}
            className="h-4 w-4"
          />
          Eigenes Foto hochladen
        </label>
        {source === "UPLOAD" && (
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className={`${fileInputClasses} ml-6`}
          />
        )}

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="radio"
            name="photoSource"
            value="GOOGLE"
            checked={source === "GOOGLE"}
            onChange={() => setSource("GOOGLE")}
            className="h-4 w-4"
          />
          Von Google Maps übernehmen
        </label>
        {source === "GOOGLE" && (
          <p className="ml-6 text-xs text-text-muted">
            Wird beim Speichern automatisch von Google Maps übernommen.
          </p>
        )}
      </div>
    </div>
  );
}
