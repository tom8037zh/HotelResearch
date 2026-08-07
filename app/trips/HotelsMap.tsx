"use client";

import { useEffect } from "react";
import { DivIcon } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

interface HotelMarker {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Teardrop-Pin + Name-Label, 1:1 aus "Hotel Table Redesign.dc.html" übernommen. iconSize/iconAnchor
// bleiben [0,0], die Zentrierung passiert per CSS-transform im HTML selbst (translate(-50%,-100%)) -
// so bleibt die Pin-Spitze exakt auf der Koordinate, unabhängig von der (variablen) Label-Breite.
function createHotelIcon(name: string, isSelected: boolean): DivIcon {
  const labelBg = isSelected ? "#18181b" : "#fff";
  const labelColor = isSelected ? "#fff" : "#18181b";
  const labelBorder = isSelected ? "1px solid #18181b" : "1px solid #e4e4e7";

  return new DivIcon({
    className: "hotel-marker-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `
      <div style="transform:translate(-50%,-100%); display:flex; flex-direction:column; align-items:center; gap:4px;">
        <span style="background:${labelBg}; border:${labelBorder}; border-radius:6px; padding:2px 8px; font-size:11px; font-weight:500; color:${labelColor}; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,0.08); font-family:inherit;">${escapeHtml(name)}</span>
        <svg width="22" height="28" viewBox="0 0 24 32" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25)); flex-shrink:0; display:block;">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.37 18.63 0 12 0Z" fill="#18181b"/>
          <circle cx="12" cy="12" r="5" fill="#fff"/>
        </svg>
      </div>`,
  });
}

// Der Kartenbereich ist per nativem CSS `resize: vertical` vom Nutzer höhenverstellbar
// (app/trips/HotelsTable.tsx) - Leaflet merkt Größenänderungen seines Containers aber nicht von
// selbst und würde sonst mit falsch zugeschnittenem/verschobenem Kachel-Ausschnitt stehen bleiben.
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export function HotelsMap({
  hotels,
  selectedHotelId = null,
  onSelectHotel,
}: {
  hotels: HotelMarker[];
  selectedHotelId?: number | null;
  onSelectHotel?: (id: number) => void;
}) {
  const bounds: [number, number][] = hotels.map((h) => [h.latitude, h.longitude]);

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [30, 30], maxZoom: 15 }}
      className="h-full min-h-[200px] w-full rounded-[10px]"
    >
      <MapResizeHandler />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hotels.map((hotel) => {
        const isSelected = selectedHotelId === hotel.id;
        const isDimmed = selectedHotelId !== null && !isSelected;
        return (
          <Marker
            key={hotel.id}
            position={[hotel.latitude, hotel.longitude]}
            icon={createHotelIcon(hotel.name, isSelected)}
            zIndexOffset={isSelected ? 1000 : 0}
            opacity={isDimmed ? 0.4 : 1}
            eventHandlers={onSelectHotel ? { click: () => onSelectHotel(hotel.id) } : undefined}
          />
        );
      })}
    </MapContainer>
  );
}
