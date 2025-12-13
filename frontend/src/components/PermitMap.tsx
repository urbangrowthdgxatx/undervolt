"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Zap, Sun, Battery, Home, Gauge, CircuitBoard } from "lucide-react";

// You'll need to add your Mapbox token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN";

export type SignalType = "ev" | "solar" | "battery" | "adu" | "generator" | "panel" | "all";

interface PermitLocation {
  id: string;
  lat: number;
  lng: number;
  signal: SignalType;
  description: string;
  zip: string;
  district: number;
  value?: string;
  year?: number;
}

// Mock permit locations around Austin with Council Districts
const mockPermitLocations: PermitLocation[] = [
  // District 3 - South Central (78704)
  { id: "1", lat: 30.2410, lng: -97.7636, signal: "ev", description: "Level 2 EV Charger", zip: "78704", district: 3, value: "residential", year: 2024 },
  { id: "2", lat: 30.2450, lng: -97.7590, signal: "ev", description: "Tesla Wall Connector", zip: "78704", district: 3, value: "residential", year: 2024 },
  { id: "3", lat: 30.2380, lng: -97.7680, signal: "solar", description: "18.5 kW Solar System", zip: "78704", district: 3, value: "18.5 kW", year: 2024 },
  { id: "4", lat: 30.2420, lng: -97.7550, signal: "adu", description: "650 sqft ADU", zip: "78704", district: 3, value: "650 sqft", year: 2024 },
  { id: "5", lat: 30.2470, lng: -97.7620, signal: "adu", description: "Secondary dwelling unit", zip: "78704", district: 3, value: "480 sqft", year: 2023 },
  { id: "6", lat: 30.2390, lng: -97.7570, signal: "solar", description: "12.2 kW + Battery", zip: "78704", district: 3, value: "12.2 kW", year: 2024 },
  { id: "7", lat: 30.2440, lng: -97.7650, signal: "ev", description: "Commercial EV Station", zip: "78704", district: 3, value: "commercial", year: 2025 },

  // District 10 - West Austin/Westlake (78746) - Highest resilience
  { id: "8", lat: 30.2950, lng: -97.8100, signal: "generator", description: "26kW Generac Standby", zip: "78746", district: 10, value: "26 kW", year: 2024 },
  { id: "9", lat: 30.2980, lng: -97.8050, signal: "battery", description: "Tesla Powerwall 3 x2", zip: "78746", district: 10, value: "27 kWh", year: 2024 },
  { id: "10", lat: 30.2920, lng: -97.8150, signal: "solar", description: "24.4 kW + Battery", zip: "78746", district: 10, value: "24.4 kW", year: 2024 },
  { id: "11", lat: 30.3000, lng: -97.8080, signal: "generator", description: "22kW Whole Home Generator", zip: "78746", district: 10, value: "22 kW", year: 2023 },
  { id: "12", lat: 30.2940, lng: -97.8120, signal: "battery", description: "Tesla Powerwall 3", zip: "78746", district: 10, value: "13.5 kWh", year: 2025 },
  { id: "13", lat: 30.2970, lng: -97.8020, signal: "solar", description: "20.1 kW Solar Array", zip: "78746", district: 10, value: "20.1 kW", year: 2024 },
  { id: "33", lat: 30.2910, lng: -97.8050, signal: "generator", description: "20kW Kohler Generator", zip: "78746", district: 10, value: "20 kW", year: 2024 },
  { id: "34", lat: 30.2960, lng: -97.8130, signal: "solar", description: "28.2 kW Solar + Powerwall", zip: "78746", district: 10, value: "28.2 kW", year: 2025 },
  { id: "35", lat: 30.2990, lng: -97.8020, signal: "battery", description: "Enphase IQ Battery", zip: "78746", district: 10, value: "10 kWh", year: 2024 },

  // District 9 - East Austin (78702) - Density growth
  { id: "14", lat: 30.2620, lng: -97.7180, signal: "adu", description: "Backyard cottage", zip: "78702", district: 9, value: "550 sqft", year: 2024 },
  { id: "15", lat: 30.2650, lng: -97.7150, signal: "adu", description: "Garage conversion ADU", zip: "78702", district: 9, value: "420 sqft", year: 2024 },
  { id: "16", lat: 30.2600, lng: -97.7200, signal: "ev", description: "EV Charger Installation", zip: "78702", district: 9, value: "residential", year: 2024 },
  { id: "17", lat: 30.2680, lng: -97.7130, signal: "solar", description: "8.8 kW Rooftop Solar", zip: "78702", district: 9, value: "8.8 kW", year: 2023 },
  { id: "18", lat: 30.2590, lng: -97.7220, signal: "adu", description: "New ADU construction", zip: "78702", district: 9, value: "720 sqft", year: 2025 },
  { id: "36", lat: 30.2640, lng: -97.7160, signal: "adu", description: "Detached ADU", zip: "78702", district: 9, value: "600 sqft", year: 2024 },

  // District 8 - South Austin (78745)
  { id: "19", lat: 30.2080, lng: -97.7850, signal: "ev", description: "Level 2 EV Charger", zip: "78745", district: 8, value: "residential", year: 2024 },
  { id: "20", lat: 30.2050, lng: -97.7900, signal: "solar", description: "15.3 kW Solar", zip: "78745", district: 8, value: "15.3 kW", year: 2024 },
  { id: "21", lat: 30.2100, lng: -97.7820, signal: "ev", description: "EV Circuit Installation", zip: "78745", district: 8, value: "residential", year: 2024 },
  { id: "22", lat: 30.2030, lng: -97.7880, signal: "generator", description: "14kW Standby Generator", zip: "78745", district: 8, value: "14 kW", year: 2023 },
  { id: "37", lat: 30.2060, lng: -97.7830, signal: "solar", description: "12.1 kW Solar System", zip: "78745", district: 8, value: "12.1 kW", year: 2025 },

  // District 7 - Northwest (78731)
  { id: "23", lat: 30.3550, lng: -97.7580, signal: "solar", description: "22.1 kW Solar System", zip: "78731", district: 7, value: "22.1 kW", year: 2024 },
  { id: "24", lat: 30.3580, lng: -97.7550, signal: "battery", description: "Enphase Battery System", zip: "78731", district: 7, value: "10 kWh", year: 2024 },
  { id: "25", lat: 30.3520, lng: -97.7620, signal: "ev", description: "ChargePoint Home", zip: "78731", district: 7, value: "residential", year: 2024 },
  { id: "26", lat: 30.3600, lng: -97.7530, signal: "generator", description: "20kW Generator + ATS", zip: "78731", district: 7, value: "20 kW", year: 2024 },
  { id: "38", lat: 30.3570, lng: -97.7600, signal: "solar", description: "18.8 kW Solar", zip: "78731", district: 7, value: "18.8 kW", year: 2025 },

  // District 1 - North Austin (78757)
  { id: "27", lat: 30.3380, lng: -97.7280, signal: "ev", description: "EV Charger", zip: "78757", district: 1, value: "residential", year: 2024 },
  { id: "28", lat: 30.3350, lng: -97.7320, signal: "solar", description: "10.5 kW Solar", zip: "78757", district: 1, value: "10.5 kW", year: 2024 },
  { id: "29", lat: 30.3410, lng: -97.7250, signal: "adu", description: "Detached ADU", zip: "78757", district: 1, value: "580 sqft", year: 2024 },
  { id: "39", lat: 30.3400, lng: -97.7300, signal: "ev", description: "Tesla Wall Connector", zip: "78757", district: 1, value: "residential", year: 2025 },
  { id: "40", lat: 30.3360, lng: -97.7260, signal: "generator", description: "16kW Generac", zip: "78757", district: 1, value: "16 kW", year: 2024 },

  // District 9 - Windsor Park (78723)
  { id: "30", lat: 30.3050, lng: -97.6920, signal: "ev", description: "Tesla Charger", zip: "78723", district: 9, value: "residential", year: 2024 },
  { id: "31", lat: 30.3020, lng: -97.6950, signal: "solar", description: "14.2 kW Solar", zip: "78723", district: 9, value: "14.2 kW", year: 2024 },
  { id: "32", lat: 30.3080, lng: -97.6880, signal: "adu", description: "ADU with bathroom", zip: "78723", district: 9, value: "400 sqft", year: 2023 },

  // District 2 - Southeast (78741)
  { id: "41", lat: 30.2320, lng: -97.7280, signal: "ev", description: "Level 2 Charger", zip: "78741", district: 2, value: "residential", year: 2024 },
  { id: "42", lat: 30.2350, lng: -97.7250, signal: "solar", description: "9.6 kW Solar", zip: "78741", district: 2, value: "9.6 kW", year: 2024 },
  { id: "43", lat: 30.2300, lng: -97.7300, signal: "adu", description: "Backyard ADU", zip: "78741", district: 2, value: "520 sqft", year: 2025 },

  // District 5 - Far South (78748)
  { id: "44", lat: 30.1750, lng: -97.8200, signal: "solar", description: "16.4 kW Solar System", zip: "78748", district: 5, value: "16.4 kW", year: 2024 },
  { id: "45", lat: 30.1780, lng: -97.8150, signal: "ev", description: "EV Charger", zip: "78748", district: 5, value: "residential", year: 2024 },
  { id: "46", lat: 30.1720, lng: -97.8180, signal: "generator", description: "18kW Standby Gen", zip: "78748", district: 5, value: "18 kW", year: 2024 },

  // District 6 - Far Northwest (78750)
  { id: "47", lat: 30.4150, lng: -97.8050, signal: "solar", description: "21.3 kW Solar", zip: "78750", district: 6, value: "21.3 kW", year: 2024 },
  { id: "48", lat: 30.4180, lng: -97.8020, signal: "battery", description: "Tesla Powerwall 2", zip: "78750", district: 6, value: "13.5 kWh", year: 2024 },
  { id: "49", lat: 30.4120, lng: -97.8080, signal: "generator", description: "22kW Generac", zip: "78750", district: 6, value: "22 kW", year: 2025 },

  // District 4 - East (78721)
  { id: "50", lat: 30.2780, lng: -97.6850, signal: "adu", description: "ADU Construction", zip: "78721", district: 4, value: "480 sqft", year: 2024 },
  { id: "51", lat: 30.2750, lng: -97.6880, signal: "ev", description: "EV Charger Install", zip: "78721", district: 4, value: "residential", year: 2024 },
  { id: "52", lat: 30.2810, lng: -97.6820, signal: "solar", description: "7.2 kW Solar", zip: "78721", district: 4, value: "7.2 kW", year: 2025 },

  // Panel Upgrades - Infrastructure strain indicators
  { id: "53", lat: 30.2430, lng: -97.7610, signal: "panel", description: "200A Panel Upgrade", zip: "78704", district: 3, value: "200A", year: 2024 },
  { id: "54", lat: 30.2960, lng: -97.8090, signal: "panel", description: "Service Upgrade 200A", zip: "78746", district: 10, value: "200A", year: 2024 },
  { id: "55", lat: 30.2630, lng: -97.7170, signal: "panel", description: "Panel Upgrade for EV", zip: "78702", district: 9, value: "200A", year: 2024 },
  { id: "56", lat: 30.2070, lng: -97.7860, signal: "panel", description: "Electrical Service Upgrade", zip: "78745", district: 8, value: "200A", year: 2023 },
  { id: "57", lat: 30.3560, lng: -97.7590, signal: "panel", description: "200A Main Panel", zip: "78731", district: 7, value: "200A", year: 2024 },
  { id: "58", lat: 30.3370, lng: -97.7290, signal: "panel", description: "Panel Upgrade + Subpanel", zip: "78757", district: 1, value: "200A", year: 2025 },
  { id: "59", lat: 30.2340, lng: -97.7270, signal: "panel", description: "Service Upgrade", zip: "78741", district: 2, value: "200A", year: 2024 },
  { id: "60", lat: 30.1760, lng: -97.8170, signal: "panel", description: "200A Panel for Solar", zip: "78748", district: 5, value: "200A", year: 2024 },
  { id: "61", lat: 30.4140, lng: -97.8060, signal: "panel", description: "Main Panel Replacement", zip: "78750", district: 6, value: "200A", year: 2024 },
  { id: "62", lat: 30.2770, lng: -97.6860, signal: "panel", description: "Electrical Upgrade", zip: "78721", district: 4, value: "200A", year: 2024 },
];

// Black & white color scheme - differentiate by opacity/style
const signalConfig: Record<SignalType, { color: string; icon: typeof Zap; label: string; style: "solid" | "ring" }> = {
  ev: { color: "#ffffff", icon: Zap, label: "EV Charger", style: "solid" },
  solar: { color: "#d4d4d4", icon: Sun, label: "Solar", style: "solid" },
  battery: { color: "#a3a3a3", icon: Battery, label: "Battery", style: "solid" },
  adu: { color: "#737373", icon: Home, label: "ADU", style: "solid" },
  generator: { color: "#ffffff", icon: Gauge, label: "Generator", style: "ring" },
  panel: { color: "#a3a3a3", icon: CircuitBoard, label: "Panel Upgrade", style: "ring" },
  all: { color: "#ffffff", icon: Zap, label: "All Signals", style: "solid" },
};

interface PermitMapProps {
  filter?: SignalType | SignalType[];
  highlightZip?: string;
  highlightDistrict?: number;
  className?: string;
  showLegend?: boolean;
}

export function PermitMap({ filter = "all", highlightZip, highlightDistrict, className = "", showLegend = false }: PermitMapProps) {
  const [selectedPermit, setSelectedPermit] = useState<PermitLocation | null>(null);
  const [viewState, setViewState] = useState({
    latitude: 30.2672,
    longitude: -97.7431,
    zoom: 11,
  });

  // Filter permits based on signal type (supports single or array)
  const filteredPermits = mockPermitLocations.filter((p) => {
    if (filter === "all") return true;
    if (Array.isArray(filter)) return filter.includes(p.signal as SignalType);
    return p.signal === filter;
  });

  // Determine if a permit should be highlighted
  const isPermitHighlighted = (permit: PermitLocation) => {
    if (highlightDistrict) return permit.district === highlightDistrict;
    if (highlightZip) return permit.zip === highlightZip;
    return true;
  };

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {filteredPermits.map((permit) => {
          const config = signalConfig[permit.signal];
          const Icon = config.icon;
          const isHighlighted = isPermitHighlighted(permit);

          return (
            <Marker
              key={permit.id}
              latitude={permit.lat}
              longitude={permit.lng}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedPermit(permit);
              }}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-125 ${
                  isHighlighted ? "opacity-100" : "opacity-20"
                } ${config.style === "ring" ? "border-2 border-white bg-transparent" : ""}`}
                style={config.style === "solid" ? {
                  backgroundColor: config.color,
                  boxShadow: `0 0 8px ${config.color}60`
                } : {
                  boxShadow: `0 0 8px rgba(255,255,255,0.4)`
                }}
              >
                <Icon size={12} className={config.style === "ring" ? "text-white" : "text-black"} />
              </div>
            </Marker>
          );
        })}

        {selectedPermit && (
          <Popup
            latitude={selectedPermit.lat}
            longitude={selectedPermit.lng}
            anchor="bottom"
            onClose={() => setSelectedPermit(null)}
            closeButton={true}
            closeOnClick={false}
            className="permit-popup"
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: signalConfig[selectedPermit.signal].color }}
                >
                  {(() => {
                    const Icon = signalConfig[selectedPermit.signal].icon;
                    return <Icon size={12} className="text-black" />;
                  })()}
                </div>
                <span className="font-medium text-gray-900">
                  {signalConfig[selectedPermit.signal].label}
                </span>
              </div>
              <p className="text-sm text-gray-600">{selectedPermit.description}</p>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>District {selectedPermit.district} • {selectedPermit.zip}</span>
                {selectedPermit.value && <span>{selectedPermit.value}</span>}
              </div>
              {selectedPermit.year && (
                <div className="text-xs text-gray-400 mt-1">{selectedPermit.year}</div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend - only show if showLegend is true */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Signals</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(signalConfig)
              .filter(([key]) => key !== "all")
              .map(([key, config]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs text-gray-300">{config.label}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
