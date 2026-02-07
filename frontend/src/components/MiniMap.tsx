"use client";

import { useMemo } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { GeoData, SignalType } from "@/lib/chat-schema";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN";

// District centroids
const districtCentroids: Record<number, { lat: number; lng: number; name: string }> = {
  1: { lat: 30.3380, lng: -97.7280, name: "North Austin" },
  2: { lat: 30.2320, lng: -97.7280, name: "Southeast" },
  3: { lat: 30.2420, lng: -97.7620, name: "South Central" },
  4: { lat: 30.2780, lng: -97.6850, name: "East" },
  5: { lat: 30.1750, lng: -97.8200, name: "Far South" },
  6: { lat: 30.4150, lng: -97.8050, name: "Far Northwest" },
  7: { lat: 30.3550, lng: -97.7580, name: "Northwest" },
  8: { lat: 30.2080, lng: -97.7850, name: "South Austin" },
  9: { lat: 30.2650, lng: -97.7150, name: "East Austin" },
  10: { lat: 30.2950, lng: -97.8100, name: "Westlake" },
};

// Signal type colors
const signalColors: Record<SignalType, string> = {
  ev: "#22c55e",
  solar: "#eab308",
  battery: "#3b82f6",
  adu: "#8b5cf6",
  generator: "#ef4444",
  panel: "#f97316",
  all: "#ffffff",
};

interface MiniMapProps {
  geoData: GeoData;
}

export function MiniMap({ geoData }: MiniMapProps) {
  // Calculate center and zoom based on geoData
  const viewState = useMemo(() => {
    const districts = geoData.districts || [];

    if (districts.length === 0) {
      // Default to Austin center
      return { latitude: 30.2672, longitude: -97.7431, zoom: 10 };
    }

    if (districts.length === 1) {
      // Single district - center on it
      const centroid = districtCentroids[districts[0]];
      if (centroid) {
        return { latitude: centroid.lat, longitude: centroid.lng, zoom: 11.5 };
      }
    }

    // Multiple districts - find bounding box
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    districts.forEach(d => {
      const c = districtCentroids[d];
      if (c) {
        minLat = Math.min(minLat, c.lat);
        maxLat = Math.max(maxLat, c.lat);
        minLng = Math.min(minLng, c.lng);
        maxLng = Math.max(maxLng, c.lng);
      }
    });

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      zoom: 10.5,
    };
  }, [geoData]);

  const signalColor = geoData.signal ? signalColors[geoData.signal] : "#ffffff";
  const highlightedDistricts = geoData.districts || [];

  return (
    <div className="w-full h-[180px] rounded-lg overflow-hidden">
      <Map
        {...viewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactive={false}
        attributionControl={false}
      >
        {/* Show all district circles */}
        {Object.entries(districtCentroids).map(([d, centroid]) => {
          const district = Number(d);
          const isHighlighted = highlightedDistricts.includes(district);

          return (
            <Marker
              key={`district-${district}`}
              latitude={centroid.lat}
              longitude={centroid.lng}
              anchor="center"
            >
              <div
                className="flex items-center justify-center transition-all"
                style={{
                  width: isHighlighted ? 48 : 24,
                  height: isHighlighted ? 48 : 24,
                  borderRadius: "50%",
                  backgroundColor: isHighlighted ? `${signalColor}40` : "rgba(255,255,255,0.1)",
                  border: isHighlighted ? `3px solid ${signalColor}` : "1px solid rgba(255,255,255,0.2)",
                  boxShadow: isHighlighted ? `0 0 20px ${signalColor}60` : "none",
                }}
              >
                {isHighlighted && (
                  <span className="text-white font-bold text-sm">
                    {district}
                  </span>
                )}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
