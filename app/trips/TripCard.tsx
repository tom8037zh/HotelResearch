"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, PencilIcon, PhotoIcon, TrashIcon } from "@/app/components/icons";
import { ConfirmDeleteButton } from "@/app/components/ConfirmDeleteButton";
import { deleteTrip } from "./actions";

function countPillClasses(count: number): string {
  if (count === 0) return "bg-tier-neutral-bg text-tier-neutral";
  if (count >= 5) return "bg-tier-green-bg text-tier-green";
  return "bg-tier-blue-bg text-tier-blue";
}

function hotelLabel(count: number): string {
  if (count === 0) return "Keine Hotels";
  if (count === 1) return "1 Hotel";
  return `${count} Hotels`;
}

export interface TripCardData {
  id: number;
  name: string;
  hotelCount: number;
  /** `updatedAt` als Millisekunden-Timestamp, dient zugleich als "hat Foto?"-Flag und Cache-Buster
   *  für die Foto-Route (sonst liefert der Browser nach einem Foto-Wechsel bis zu 1h das alte Bild). */
  photoVersion: number | null;
  dateRangeLabel: string | null;
}

export function TripCard({ trip }: { trip: TripCardData }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/trips/${trip.id}`)}
      className="cursor-pointer overflow-hidden rounded-[14px] border border-card-border bg-white transition-shadow hover:shadow-sm"
    >
      <div className="flex h-[130px] w-full items-center justify-center overflow-hidden bg-row-divider">
        {trip.photoVersion !== null ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamische eigene API-Route, kein next/image nötig
          <img src={`/api/trips/${trip.id}/photo?v=${trip.photoVersion}`} alt="" className="h-full w-full object-cover" />
        ) : (
          <PhotoIcon size={28} />
        )}
      </div>
      <div className="px-5 pt-4 pb-5">
        <p className="truncate text-[15px] font-semibold text-text-primary">{trip.name}</p>
        <p className="mb-3 text-xs text-text-muted">{trip.dateRangeLabel ?? " "}</p>

        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${countPillClasses(trip.hotelCount)}`}
        >
          {hotelLabel(trip.hotelCount)}
        </span>

        <div className="mt-[18px] flex items-center justify-between border-t border-row-divider pt-3.5">
          <Link
            href={`/trips/${trip.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-primary no-underline"
          >
            Ansehen
            <ChevronRightIcon size={13} />
          </Link>
          <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
            <Link href={`/trips/${trip.id}/edit`} title="Bearbeiten">
              <PencilIcon size={15} />
            </Link>
            <ConfirmDeleteButton
              action={deleteTrip.bind(null, trip.id)}
              confirmMessage={`"${trip.name}" wirklich löschen? Damit werden auch alle ${trip.hotelCount} zugehörigen Hotels (inkl. Bewertungen) unwiderruflich gelöscht.`}
              className="flex items-center"
              title="Löschen"
            >
              <TrashIcon size={15} />
            </ConfirmDeleteButton>
          </div>
        </div>
      </div>
    </div>
  );
}
