"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PencilIcon, PhotoIcon, TrashIcon } from "@/app/components/icons";
import { RatingPill } from "@/app/components/RatingPill";
import { ConfirmDeleteButton } from "@/app/components/ConfirmDeleteButton";
import { deleteHotel } from "@/app/hotels/actions";
import { HotelsMap } from "./HotelsMapLoader";

export interface RatingInfo {
  url: string;
  rating: number | null;
  reviewsCount: number | null;
}

export interface HotelRow {
  id: number;
  name: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  /** `updatedAt` als Millisekunden-Timestamp, dient zugleich als "hat Foto?"-Flag und Cache-Buster
   *  für die Foto-Route (sonst liefert der Browser nach einem Foto-Wechsel bis zu 1h das alte Bild). */
  photoVersion: number | null;
  google: RatingInfo | null;
  tripadvisor: RatingInfo | null;
  booking: RatingInfo | null;
}

type SortColumn = "name" | "google" | "tripadvisor" | "booking";

function sortHotels(rows: HotelRow[], col: SortColumn, desc: boolean): HotelRow[] {
  const dir = desc ? -1 : 1;
  return [...rows].sort((a, b) => {
    if (col === "name") return a.name.localeCompare(b.name) * dir;
    const av = a[col]?.rating ?? null;
    const bv = b[col]?.rating ?? null;
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return (av - bv) * dir;
  });
}

function SortArrow({ active, desc }: { active: boolean; desc: boolean }) {
  if (!active) return null;
  return <span className="ml-1 text-[10px] text-text-muted">{desc ? "▼" : "▲"}</span>;
}

const gridCols = "grid-cols-[1.5fr_0.9fr_0.9fr_0.9fr_2.1fr_110px]";

export function HotelsTable({ tripId, hotels }: { tripId: number; hotels: HotelRow[] }) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDesc, setSortDesc] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);

  const sorted = useMemo(() => sortHotels(hotels, sortColumn, sortDesc), [hotels, sortColumn, sortDesc]);

  const hotelsWithCoords = hotels
    .filter((h) => h.latitude !== null && h.longitude !== null)
    .map((h) => ({ id: h.id, name: h.name, latitude: h.latitude as number, longitude: h.longitude as number }));

  function handleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDesc((d) => !d);
    } else {
      setSortColumn(col);
      setSortDesc(false);
    }
  }

  function toggleSelect(id: number) {
    setSelectedHotelId((current) => (current === id ? null : id));
  }

  if (hotels.length === 0) {
    return <p className="text-text-secondary">Noch keine Hotels für diese Reise angelegt.</p>;
  }

  return (
    <>
      <div className="overflow-hidden rounded-[14px] border border-card-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <div className="min-w-[920px] text-sm">
            <div className={`grid ${gridCols} items-center bg-[#fafafa]`}>
              <button
                onClick={() => handleSort("name")}
                className="flex items-center py-3.5 pr-3 pl-5 text-left font-medium text-text-secondary select-none"
              >
                Hotel <SortArrow active={sortColumn === "name"} desc={sortDesc} />
              </button>
              <button
                onClick={() => handleSort("google")}
                className="flex items-center px-3 py-3.5 text-left font-medium text-text-secondary select-none"
              >
                Google <SortArrow active={sortColumn === "google"} desc={sortDesc} />
              </button>
              <button
                onClick={() => handleSort("tripadvisor")}
                className="flex items-center px-3 py-3.5 text-left font-medium text-text-secondary select-none"
              >
                TripAdvisor <SortArrow active={sortColumn === "tripadvisor"} desc={sortDesc} />
              </button>
              <button
                onClick={() => handleSort("booking")}
                className="flex items-center px-3 py-3.5 text-left font-medium text-text-secondary select-none"
              >
                Booking.com <SortArrow active={sortColumn === "booking"} desc={sortDesc} />
              </button>
              <div className="px-3 py-3.5 font-medium text-text-secondary">Notizen</div>
              <div className="py-3.5 pr-5 pl-3 text-right font-medium text-text-secondary">Aktionen</div>
            </div>

            {sorted.map((hotel) => {
              const isSelected = selectedHotelId === hotel.id;
              return (
                <div
                  key={hotel.id}
                  onClick={() => toggleSelect(hotel.id)}
                  className={`grid ${gridCols} cursor-pointer items-center border-t border-row-divider ${isSelected ? "bg-row-divider" : "bg-white"}`}
                >
                  <div className="flex items-center gap-2.5 py-4 pr-3 pl-5">
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
                    <span className="font-medium text-text-primary">{hotel.name}</span>
                  </div>
                  <div className="px-3 py-4">
                    <RatingPill rating={hotel.google?.rating ?? null} reviewsCount={hotel.google?.reviewsCount ?? null} scale={5} />
                  </div>
                  <div className="px-3 py-4">
                    <RatingPill
                      rating={hotel.tripadvisor?.rating ?? null}
                      reviewsCount={hotel.tripadvisor?.reviewsCount ?? null}
                      scale={5}
                    />
                  </div>
                  <div className="px-3 py-4">
                    <RatingPill rating={hotel.booking?.rating ?? null} reviewsCount={hotel.booking?.reviewsCount ?? null} scale={10} />
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
            })}
          </div>
        </div>
      </div>

      {hotelsWithCoords.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-[14px] border border-card-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="bg-[#fafafa] px-5 py-3.5">
            <p className="text-[13px] font-medium text-text-secondary">Standorte</p>
          </div>
          <div className="p-4">
            <div className="h-[420px] min-h-[200px] max-h-[900px] resize-y overflow-auto rounded-[10px]">
              <HotelsMap hotels={hotelsWithCoords} selectedHotelId={selectedHotelId} onSelectHotel={toggleSelect} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
