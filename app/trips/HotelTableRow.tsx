"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripIcon, PencilIcon, PhotoIcon, TrashIcon } from "@/app/components/icons";
import { RatingPill } from "@/app/components/RatingPill";
import { StatusBadge } from "@/app/components/StatusBadge";
import { ConfirmDeleteButton } from "@/app/components/ConfirmDeleteButton";
import { deleteHotel } from "@/app/hotels/actions";
import type { HotelRow } from "./HotelsTable";

export const desktopGridCols = "grid-cols-[44px_1.5fr_0.9fr_0.9fr_0.9fr_2fr_110px]";

/**
 * Eine Zeile der Desktop-Hoteltabelle. Eigene Komponente (statt inline in einer .map()-Callback), weil
 * `useSortable` als Hook nur in einer echten Komponente stehen darf.
 */
export function HotelTableRow({
  tripId,
  hotel,
  isSelected,
  isOrderMode,
  onSelect,
}: {
  tripId: number;
  hotel: HotelRow;
  isSelected: boolean;
  isOrderMode: boolean;
  onSelect: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: hotel.id,
    disabled: !isOrderMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(hotel.id)}
      className={`grid ${desktopGridCols} cursor-pointer items-center border-t border-row-divider ${
        isSelected ? "bg-row-divider" : "bg-white"
      } ${isDragging ? "opacity-70" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title={isOrderMode ? "Ziehen zum Umsortieren" : "Erst nach \"Reihenfolge\" sortieren, um zu ziehen"}
        className={`flex h-full items-center justify-center py-4 pl-5 ${
          isOrderMode ? "cursor-grab touch-none active:cursor-grabbing" : "cursor-not-allowed opacity-30"
        }`}
      >
        <GripIcon size={16} />
      </div>

      <div className="flex items-center gap-2.5 py-4 pr-3">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-row-divider">
          {hotel.photoVersion !== null ? (
            // eslint-disable-next-line @next/next/no-img-element -- dynamische eigene API-Route, kein next/image nötig
            <img
              src={`/api/hotels/${hotel.id}/photo?v=${hotel.photoVersion}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <PhotoIcon size={20} />
          )}
        </div>
        <div className="min-w-0">
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
          {hotel.status && (
            <div className="mt-1">
              <StatusBadge status={hotel.status} />
            </div>
          )}
        </div>
      </div>

      <div className="px-3 py-4">
        <RatingPill
          rating={hotel.google?.rating ?? null}
          reviewsCount={hotel.google?.reviewsCount ?? null}
          scale={5}
          url={hotel.google?.url}
        />
      </div>
      <div className="px-3 py-4">
        <RatingPill
          rating={hotel.tripadvisor?.rating ?? null}
          reviewsCount={hotel.tripadvisor?.reviewsCount ?? null}
          scale={5}
          url={hotel.tripadvisor?.url}
        />
      </div>
      <div className="px-3 py-4">
        <RatingPill
          rating={hotel.booking?.rating ?? null}
          reviewsCount={hotel.booking?.reviewsCount ?? null}
          scale={10}
          url={hotel.booking?.url}
        />
      </div>
      <div className="truncate px-3 py-4 text-text-secondary">{hotel.notes || "—"}</div>
      <div className="flex items-center justify-end gap-2.5 py-4 pr-5 pl-3" onClick={(e) => e.stopPropagation()}>
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
  );
}
