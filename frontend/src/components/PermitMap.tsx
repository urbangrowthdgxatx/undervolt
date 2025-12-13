"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Zap, Sun, Battery, Home, Gauge } from "lucide-react";

// You'll need to add your Mapbox token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN";

export type SignalType = "ev" | "solar" | "battery" | "adu" | "generator" | "all";

interface PermitLocation {
  id: string;
  lat: number;
  lng: number;
  signal: SignalType;
  description: string;
  zip: string;
  value?: string;
}

// Mock permit locations around Austin
const mockPermitLocations: PermitLocation[] = [
  // 78704 - South Austin (high EV, ADU)
  { id: "1", lat: 30.2410, lng: -97.7636, signal: "ev", description: "Level 2 EV Charger", zip: "78704", value: "residential" },
  { id: "2", lat: 30.2450, lng: -97.7590, signal: "ev", description: "Tesla Wall Connector", zip: "78704", value: "residential" },
  { id: "3", lat: 30.2380, lng: -97.7680, signal: "solar", description: "18.5 kW Solar System", zip: "78704", value: "18.5 kW" },
  { id: "4", lat: 30.2420, lng: -97.7550, signal: "adu", description: "650 sqft ADU", zip: "78704", value: "650 sqft" },
  { id: "5", lat: 30.2470, lng: -97.7620, signal: "adu", description: "Secondary dwelling unit", zip: "78704", value: "480 sqft" },
  { id: "6", lat: 30.2390, lng: -97.7570, signal: "solar", description: "12.2 kW + Battery", zip: "78704", value: "12.2 kW" },
  { id: "7", lat: 30.2440, lng: -97.7650, signal: "ev", description: "Commercial EV Station", zip: "78704", value: "commercial" },

  // 78746 - Westlake (high resilience)
  { id: "8", lat: 30.2950, lng: -97.8100, signal: "generator", description: "26kW Generac Standby", zip: "78746", value: "26 kW" },
  { id: "9", lat: 30.2980, lng: -97.8050, signal: "battery", description: "Tesla Powerwall 3 x2", zip: "78746", value: "27 kWh" },
  { id: "10", lat: 30.2920, lng: -97.8150, signal: "solar", description: "24.4 kW + Battery", zip: "78746", value: "24.4 kW" },
  { id: "11", lat: 30.3000, lng: -97.8080, signal: "generator", description: "22kW Whole Home Generator", zip: "78746", value: "22 kW" },
  { id: "12", lat: 30.2940, lng: -97.8120, signal: "battery", description: "Tesla Powerwall 3", zip: "78746", value: "13.5 kWh" },
  { id: "13", lat: 30.2970, lng: -97.8020, signal: "solar", description: "20.1 kW Solar Array", zip: "78746", value: "20.1 kW" },

  // 78702 - East Austin (density growth)
  { id: "14", lat: 30.2620, lng: -97.7180, signal: "adu", description: "Backyard cottage", zip: "78702", value: "550 sqft" },
  { id: "15", lat: 30.2650, lng: -97.7150, signal: "adu", description: "Garage conversion ADU", zip: "78702", value: "420 sqft" },
  { id: "16", lat: 30.2600, lng: -97.7200, signal: "ev", description: "EV Charger Installation", zip: "78702", value: "residential" },
  { id: "17", lat: 30.2680, lng: -97.7130, signal: "solar", description: "8.8 kW Rooftop Solar", zip: "78702", value: "8.8 kW" },
  { id: "18", lat: 30.2590, lng: -97.7220, signal: "adu", description: "New ADU construction", zip: "78702", value: "720 sqft" },

  // 78745 - South Austin
  { id: "19", lat: 30.2080, lng: -97.7850, signal: "ev", description: "Level 2 EV Charger", zip: "78745", value: "residential" },
  { id: "20", lat: 30.2050, lng: -97.7900, signal: "solar", description: "15.3 kW Solar", zip: "78745", value: "15.3 kW" },
  { id: "21", lat: 30.2100, lng: -97.7820, signal: "ev", description: "EV Circuit Installation", zip: "78745", value: "residential" },
  { id: "22", lat: 30.2030, lng: -97.7880, signal: "generator", description: "14kW Standby Generator", zip: "78745", value: "14 kW" },

  // 78731 - Northwest
  { id: "23", lat: 30.3550, lng: -97.7580, signal: "solar", description: "22.1 kW Solar System", zip: "78731", value: "22.1 kW" },
  { id: "24", lat: 30.3580, lng: -97.7550, signal: "battery", description: "Enphase Battery System", zip: "78731", value: "10 kWh" },
  { id: "25", lat: 30.3520, lng: -97.7620, signal: "ev", description: "ChargePoint Home", zip: "78731", value: "residential" },
  { id: "26", lat: 30.3600, lng: -97.7530, signal: "generator", description: "20kW Generator + ATS", zip: "78731", value: "20 kW" },

  // 78757 - North Central
  { id: "27", lat: 30.3380, lng: -97.7280, signal: "ev", description: "EV Charger", zip: "78757", value: "residential" },
  { id: "28", lat: 30.3350, lng: -97.7320, signal: "solar", description: "10.5 kW Solar", zip: "78757", value: "10.5 kW" },
  { id: "29", lat: 30.3410, lng: -97.7250, signal: "adu", description: "Detached ADU", zip: "78757", value: "580 sqft" },

  // 78723 - Windsor Park
  { id: "30", lat: 30.3050, lng: -97.6920, signal: "ev", description: "Tesla Charger", zip: "78723", value: "residential" },
  { id: "31", lat: 30.3020, lng: -97.6950, signal: "solar", description: "14.2 kW Solar", zip: "78723", value: "14.2 kW" },
  { id: "32", lat: 30.3080, lng: -97.6880, signal: "adu", description: "ADU with bathroom", zip: "78723", value: "400 sqft" },
];

// Black & white color scheme - differentiate by opacity/style
const signalConfig: Record<SignalType, { color: string; icon: typeof Zap; label: string; style: "solid" | "ring" }> = {
  ev: { color: "#ffffff", icon: Zap, label: "EV Charger", style: "solid" },
  solar: { color: "#d4d4d4", icon: Sun, label: "Solar", style: "solid" },
  battery: { color: "#a3a3a3", icon: Battery, label: "Battery", style: "solid" },
  adu: { color: "#737373", icon: Home, label: "ADU", style: "solid" },
  generator: { color: "#ffffff", icon: Gauge, label: "Generator", style: "ring" },
  all: { color: "#ffffff", icon: Zap, label: "All Signals", style: "solid" },
};

interface PermitMapProps {
  filter?: SignalType | SignalType[];
  highlightZip?: string;
  className?: string;
  showLegend?: boolean;
}

export function PermitMap({ filter = "all", highlightZip, className = "", showLegend = false }: PermitMapProps) {
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
          const isHighlighted = highlightZip ? permit.zip === highlightZip : true;

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
            <div className="p-2 min-w-[180px]">
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
                <span>Zip: {selectedPermit.zip}</span>
                {selectedPermit.value && <span>{selectedPermit.value}</span>}
              </div>
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
