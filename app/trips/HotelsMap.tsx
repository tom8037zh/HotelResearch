"use client";

import { Icon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Leaflets Standard-Marker-Icon referenziert relative Bild-Pfade, die Turbopack beim Bundlen von
// node_modules-Assets nicht zuverlässig auflöst - daher direkt über eine feste, versionierte
// CDN-URL referenzieren (unpkg spiegelt exakt die installierte Leaflet-Version).
const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface HotelMarker {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export function HotelsMap({ hotels }: { hotels: HotelMarker[] }) {
  const bounds: [number, number][] = hotels.map((h) => [h.latitude, h.longitude]);

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [30, 30], maxZoom: 15 }}
      className="h-full min-h-[300px] w-full rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hotels.map((hotel) => (
        <Marker key={hotel.id} position={[hotel.latitude, hotel.longitude]} icon={markerIcon}>
          <Popup>{hotel.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
