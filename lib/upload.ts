export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 MB
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface PhotoData {
  // Prisma 7 erwartet für `Bytes`-Felder konkret Uint8Array<ArrayBuffer>; Node-`Buffer` (das ein
  // breiteres ArrayBufferLike zulässt) ist dafür nicht direkt zuweisbar, s. TS2322 sonst.
  bytes: Uint8Array<ArrayBuffer>;
  type: string;
}

/**
 * Liest ein Foto-Datei-Feld aus einem FormData-Objekt.
 * - Kein Feld ausgefüllt (leere/keine Datei) -> null.
 * - Zu groß oder falscher Mime-Type -> wirft eine deutsche Fehlermeldung (vom Aufrufer als
 *   Formularfehler im bestehenden `state.error`-Muster weiterzureichen).
 */
export async function readPhotoFromForm(formData: FormData, field: string): Promise<PhotoData | null> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Das Foto ist zu groß (max. 4 MB).");
  }

  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    throw new Error("Bitte ein Foto im Format JPEG, PNG oder WebP hochladen.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  return { bytes, type: file.type };
}

/**
 * Lädt ein Bild von einer URL herunter (für den "Von Google Maps übernehmen"-Fall).
 * Soft-Fail wie alle Apify-nahen Netzwerkzugriffe im Projekt: bei jedem Fehler (Netzwerk, falscher
 * Typ, zu groß) wird null zurückgegeben statt zu werfen, damit das Hotel trotzdem ohne Foto
 * gespeichert werden kann.
 */
export async function downloadImage(url: string, maxBytes: number = MAX_PHOTO_BYTES): Promise<PhotoData | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!ALLOWED_PHOTO_TYPES.includes(type)) return null;

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) return null;

    return { bytes: new Uint8Array(arrayBuffer), type };
  } catch (err) {
    console.error("Bild-Download fehlgeschlagen:", err);
    return null;
  }
}
