"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripIcon } from "@/app/components/icons";
import type { HotelStatusValue } from "@/app/components/StatusBadge";
import { HotelsMap } from "./HotelsMapLoader";
import { HotelCard } from "./HotelCard";
import { HotelTableRow, desktopGridCols } from "./HotelTableRow";
import { reorderHotels } from "@/app/hotels/actions";

export interface RatingInfo {
  url: string;
  rating: number | null;
  reviewsCount: number | null;
}

export interface HotelRow {
  id: number;
  name: string;
  website: string | null;
  notes: string | null;
  status: HotelStatusValue | null;
  sortOrder: number;
  latitude: number | null;
  longitude: number | null;
  /** `updatedAt` als Millisekunden-Timestamp, dient zugleich als "hat Foto?"-Flag und Cache-Buster
   *  für die Foto-Route (sonst liefert der Browser nach einem Foto-Wechsel bis zu 1h das alte Bild). */
  photoVersion: number | null;
  google: RatingInfo | null;
  tripadvisor: RatingInfo | null;
  booking: RatingInfo | null;
}

type SortColumn = "order" | "name" | "google" | "tripadvisor" | "booking";

function sortHotels(rows: HotelRow[], col: SortColumn, desc: boolean): HotelRow[] {
  if (col === "order") return [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
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

const SORT_COLUMN_LABELS: Record<SortColumn, string> = {
  order: "Reihenfolge",
  name: "Hotel",
  google: "Google",
  tripadvisor: "TripAdvisor",
  booking: "Booking.com",
};

export function HotelsTable({ tripId, hotels }: { tripId: number; hotels: HotelRow[] }) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("order");
  const [sortDesc, setSortDesc] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);

  // Lokale, optimistisch aktualisierte Reihenfolge fürs Drag-and-Drop (sonst müsste man auf den
  // Server-Roundtrip warten, bis eine Umsortierung sichtbar wird). Wird neu aus `hotels` aufgebaut,
  // sobald sich die Menge der Hotel-IDs ändert (Hotel angelegt/gelöscht) - ansonsten bleibt eine gerade
  // laufende manuelle Sortierung unangetastet. State-Anpassung passiert direkt im Render statt in einem
  // Effect (React-empfohlenes Muster fürs Ableiten von State aus geänderten Props, vermeidet einen
  // zusätzlichen Render-Durchlauf durch setState im Effect-Body).
  const hotelIdsKey = useMemo(() => hotels.map((h) => h.id).sort((a, b) => a - b).join(","), [hotels]);
  const [orderedIds, setOrderedIds] = useState<number[]>(() =>
    [...hotels].sort((a, b) => a.sortOrder - b.sortOrder).map((h) => h.id)
  );
  const [syncedHotelIdsKey, setSyncedHotelIdsKey] = useState(hotelIdsKey);
  if (hotelIdsKey !== syncedHotelIdsKey) {
    setSyncedHotelIdsKey(hotelIdsKey);
    setOrderedIds([...hotels].sort((a, b) => a.sortOrder - b.sortOrder).map((h) => h.id));
  }

  const hotelsById = useMemo(() => new Map(hotels.map((h) => [h.id, h])), [hotels]);

  const sorted = useMemo(() => {
    if (sortColumn === "order") {
      return orderedIds.map((id) => hotelsById.get(id)).filter((h): h is HotelRow => h !== undefined);
    }
    return sortHotels(hotels, sortColumn, sortDesc);
  }, [hotels, hotelsById, orderedIds, sortColumn, sortDesc]);

  const hotelsWithCoords = hotels
    .filter((h) => h.latitude !== null && h.longitude !== null)
    .map((h) => ({ id: h.id, name: h.name, latitude: h.latitude as number, longitude: h.longitude as number }));

  function handleSort(col: SortColumn) {
    if (col === "order") {
      setSortColumn("order");
      return;
    }
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(active.id as number);
    const newIndex = orderedIds.indexOf(over.id as number);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(newOrder);
    void reorderHotels(tripId, newOrder);
  }

  if (hotels.length === 0) {
    return <p className="text-text-secondary">Noch keine Hotels für diese Reise angelegt.</p>;
  }

  const isOrderMode = sortColumn === "order";
  const sortedIds = sorted.map((h) => h.id);

  return (
    <>
      {/* Mobile (< md): Karten-Liste statt breitem Grid, teilt sich Sortier-/Auswahl-State mit der
          Desktop-Tabelle unten. */}
      <div className="md:hidden">
        <div className="mb-3 flex items-center gap-2">
          <select
            value={sortColumn}
            onChange={(e) => handleSort(e.target.value as SortColumn)}
            className="flex-1 rounded-lg border border-card-border bg-white px-3 py-2 text-sm text-text-primary"
          >
            {(Object.keys(SORT_COLUMN_LABELS) as SortColumn[]).map((col) => (
              <option key={col} value={col}>
                Sortieren: {SORT_COLUMN_LABELS[col]}
              </option>
            ))}
          </select>
          {!isOrderMode && (
            <button
              onClick={() => setSortDesc((d) => !d)}
              title={sortDesc ? "Absteigend" : "Aufsteigend"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary"
            >
              {sortDesc ? "▼" : "▲"}
            </button>
          )}
        </div>
        <DndContext id="hotels-mobile" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {sorted.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  tripId={tripId}
                  hotel={hotel}
                  isSelected={selectedHotelId === hotel.id}
                  isOrderMode={isOrderMode}
                  onSelect={toggleSelect}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="hidden overflow-hidden rounded-[14px] border border-card-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[960px] text-sm">
            <div className={`grid ${desktopGridCols} items-center bg-[#fafafa]`}>
              <button
                onClick={() => handleSort("order")}
                title="Nach Reihenfolge sortieren"
                className="flex items-center justify-center py-3.5 pl-5"
              >
                <GripIcon size={14} className={isOrderMode ? "" : "opacity-40"} />
              </button>
              <button
                onClick={() => handleSort("name")}
                className="flex items-center py-3.5 pr-3 text-left font-medium text-text-secondary select-none"
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

            <DndContext id="hotels-desktop" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
                {sorted.map((hotel) => (
                  <HotelTableRow
                    key={hotel.id}
                    tripId={tripId}
                    hotel={hotel}
                    isSelected={selectedHotelId === hotel.id}
                    isOrderMode={isOrderMode}
                    onSelect={toggleSelect}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>

      {hotelsWithCoords.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-[14px] border border-card-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="bg-[#fafafa] px-5 py-3.5">
            <p className="text-[13px] font-medium text-text-secondary">Standorte</p>
          </div>
          <div className="border-t border-row-divider p-4">
            <div className="h-[320px] min-h-[200px] overflow-auto rounded-[10px] md:h-[420px] md:max-h-[900px] md:resize-y">
              <HotelsMap hotels={hotelsWithCoords} selectedHotelId={selectedHotelId} onSelectHotel={toggleSelect} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
