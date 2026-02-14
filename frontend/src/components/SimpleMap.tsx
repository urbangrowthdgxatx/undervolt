"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type SignalType = "ev" | "solar" | "battery" | "adu" | "generator" | "panel" | "all";

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  signal: SignalType;
  description: string;
}

interface SimpleMapProps {
  markers: MarkerData[];
  height?: number;
  filter?: SignalType | SignalType[];
}

const signalColors: Record<SignalType, string> = {
  ev: "#6366f1",
  solar: "#f59e0b",
  battery: "#3b82f6",
  adu: "#a855f7",
  generator: "#ec4899",
  panel: "#10b981",
  all: "#6b7280",
};

export function SimpleMap({ markers, height = 300, filter = "all" }: SimpleMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        style={{ height: `${height}px` }}
        className="bg-zinc-900 rounded-lg flex items-center justify-center"
      >
        <span className="text-white/40 text-sm">Loading map...</span>
      </div>
    );
  }

  const filteredMarkers = markers.filter((m) => {
    if (filter === "all") return true;
    if (Array.isArray(filter)) return filter.includes(m.signal);
    return m.signal === filter;
  });

  return (
    <div style={{ height: `${height}px` }} className="rounded-lg overflow-hidden">
      <MapContainer
        center={[30.2672, -97.7431]}
        zoom={11}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {filteredMarkers.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={[marker.lat, marker.lng]}
            radius={8}
            pathOptions={{
              fillColor: signalColors[marker.signal],
              fillOpacity: 0.8,
              color: signalColors[marker.signal],
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{marker.description}</strong>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
