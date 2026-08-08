"use client";

import Link from "next/link";
import { PencilIcon, PhotoIcon, TrashIcon } from "@/app/components/icons";
import { RatingPill } from "@/app/components/RatingPill";
import { ConfirmDeleteButton } from "@/app/components/ConfirmDeleteButton";
import { deleteHotel } from "@/app/hotels/actions";
import type { HotelRow } from "./HotelsTable";

/**
 * Kompakte Karten-Darstellung eines Hotels für die Mobile-Ansicht (< md). Bewusst kein großes
 * Bild-Banner wie TripCard - bei mehreren Hotels pro Reise soll man weiter scannen können, ähnlich der
 * Desktop-Tabellenzeile, nur gestapelt statt nebeneinander.
 */
export function HotelCard({
  tripId,
  hotel,
  isSelected,
  onSelect,
}: {
  tripId: number;
  hotel: HotelRow;
  isSelected: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <div
      onClick={() => onSelect(hotel.id)}
      className={`cursor-pointer overflow-hidden rounded-[14px] border border-card-border ${isSelected ? "bg-row-divider" : "bg-white"}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-row-divider">
          {hotel.photoVersion !== null ? (
            // eslint-disable-next-line @next/next/no-img-element -- dynamische eigene API-Route, kein next/image nötig
            <img
              src={`/api/hotels/${hotel.id}/photo?v=${hotel.photoVersion}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <PhotoIcon size={18} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {hotel.website ? (
            <a
              href={hotel.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-text-primary hover:underline"
            >
              {hotel.name}
            </a>
          ) : (
            <span className="font-medium text-text-primary">{hotel.name}</span>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <RatingPill
              rating={hotel.google?.rating ?? null}
              reviewsCount={hotel.google?.reviewsCount ?? null}
              scale={5}
              url={hotel.google?.url}
            />
            <RatingPill
              rating={hotel.tripadvisor?.rating ?? null}
              reviewsCount={hotel.tripadvisor?.reviewsCount ?? null}
              scale={5}
              url={hotel.tripadvisor?.url}
            />
            <RatingPill
              rating={hotel.booking?.rating ?? null}
              reviewsCount={hotel.booking?.reviewsCount ?? null}
              scale={10}
              url={hotel.booking?.url}
            />
          </div>

          {hotel.notes && <p className="mt-2 text-sm text-text-secondary">{hotel.notes}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/trips/${tripId}/hotels/${hotel.id}/edit`} title="Bearbeiten">
            <PencilIcon size={16} />
          </Link>
          <ConfirmDeleteButton
            action={deleteHotel.bind(null, hotel.id)}
            confirmMessage={`"${hotel.name}" wirklich löschen?`}
            className="flex items-center"
            title="Löschen"
          >
            <TrashIcon size={16} />
          </ConfirmDeleteButton>
        </div>
      </div>
    </div>
  );
}
