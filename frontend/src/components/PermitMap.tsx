"use client";

import { useState, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Zap, Sun, Battery, Home, Gauge, CircuitBoard, Map as MapIcon, BarChart3 } from "lucide-react";
import type { DistrictDataItem } from "@/lib/chat-schema";

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

// District centroids for heatmap display
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

// Calculate district scores from permits
function calculateDistrictScores(permits: PermitLocation[]) {
  const scores: Record<number, {
    electrification: number;
    gridStress: number;
    resilience: number;
    generatorRatio: number;
    total: number;
    breakdown: { solar: number; ev: number; battery: number; generator: number; adu: number; panel: number };
  }> = {};

  // Initialize all districts
  for (let d = 1; d <= 10; d++) {
    scores[d] = {
      electrification: 0,
      gridStress: 0,
      resilience: 0,
      generatorRatio: 0,
      total: 0,
      breakdown: { solar: 0, ev: 0, battery: 0, generator: 0, adu: 0, panel: 0 },
    };
  }

  // Count permits by district and type
  permits.forEach((p) => {
    if (p.district >= 1 && p.district <= 10) {
      scores[p.district].total++;
      if (p.signal in scores[p.district].breakdown) {
        scores[p.district].breakdown[p.signal as keyof typeof scores[number]["breakdown"]]++;
      }
    }
  });

  // Calculate scores
  Object.keys(scores).forEach((d) => {
    const district = Number(d);
    const b = scores[district].breakdown;

    // Electrification Score: solar + ev + battery + panel (forward-looking clean energy)
    scores[district].electrification = (b.solar * 2) + (b.ev * 1.5) + (b.battery * 3) + (b.panel * 0.5);

    // Grid Stress: (ev + adu + panel demand) - (solar + battery supply)
    scores[district].gridStress = ((b.ev * 2) + (b.adu * 1) + (b.panel * 0.5)) - ((b.solar * 1.5) + (b.battery * 2));

    // Resilience: solar + battery + generator (can survive outage)
    scores[district].resilience = (b.solar * 1) + (b.battery * 3) + (b.generator * 2);

    // Generator Paradox Ratio: generator / (solar + 1)
    scores[district].generatorRatio = b.generator / (b.solar + 1);
  });

  return scores;
}

export type ViewMode = "points" | "electrification" | "stress" | "resilience" | "paradox" | "equity";

interface PermitMapProps {
  filter?: SignalType | SignalType[];
  highlightZip?: string;
  highlightDistrict?: number;
  className?: string;
  showLegend?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  districtData?: DistrictDataItem[];  // Real data from LLM
}

export function PermitMap({
  filter = "all",
  highlightZip,
  highlightDistrict,
  className = "",
  showLegend = false,
  viewMode: externalViewMode,
  onViewModeChange,
  districtData,
}: PermitMapProps) {
  const [selectedPermit, setSelectedPermit] = useState<PermitLocation | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>("points");
  const [mapError, setMapError] = useState<string | null>(null);

  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  const [viewState, setViewState] = useState({
    latitude: 30.2672,
    longitude: -97.7431,
    zoom: 11,
  });

  // Use real district data from LLM if available, otherwise calculate from mock
  const districtScores = useMemo(() => {
    if (districtData && districtData.length > 0) {
      // Convert LLM data to our score format
      const scores: Record<number, {
        electrification: number;
        gridStress: number;
        resilience: number;
        generatorRatio: number;
        equityRate: number;
        total: number;
        totalGrowth: number;
        breakdown: { solar: number; ev: number; battery: number; generator: number; adu: number; panel: number };
        name: string;
      }> = {};

      districtData.forEach((d) => {
        const b = { solar: d.solar, ev: d.ev, battery: d.battery, generator: d.generator, adu: d.adu, panel: d.panel };
        scores[d.district] = {
          electrification: (b.solar * 2) + (b.ev * 1.5) + (b.battery * 3) + (b.panel * 0.5),
          gridStress: ((b.ev * 2) + (b.adu * 1) + (b.panel * 0.5)) - ((b.solar * 1.5) + (b.battery * 2)),
          resilience: (b.solar * 1) + (b.battery * 3) + (b.generator * 2),
          generatorRatio: b.generator / (b.solar + 1),
          equityRate: d.electrificationRate,
          total: d.totalEnergy,
          totalGrowth: d.totalGrowth,
          breakdown: b,
          name: d.name,
        };
      });
      return scores;
    }
    // Fallback to mock data calculation
    return calculateDistrictScores(mockPermitLocations);
  }, [districtData]);

  // Check if we have real data
  const hasRealData = districtData && districtData.length > 0;

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

  // Get color for district based on score and view mode
  const getDistrictColor = (district: number): string => {
    const score = districtScores[district];
    if (!score) return "rgba(255,255,255,0.1)";

    switch (viewMode) {
      case "electrification": {
        // Green gradient - higher = greener
        const normalized = Math.min(score.electrification / 30, 1);
        return `rgba(34, 197, 94, ${0.3 + normalized * 0.6})`;
      }
      case "stress": {
        // Red/Green gradient - positive = red (stressed), negative = green (surplus)
        const normalized = Math.max(-1, Math.min(1, score.gridStress / 10));
        if (normalized > 0) {
          return `rgba(239, 68, 68, ${0.3 + normalized * 0.6})`;
        } else {
          return `rgba(34, 197, 94, ${0.3 + Math.abs(normalized) * 0.6})`;
        }
      }
      case "resilience": {
        // Blue gradient - higher = more resilient
        const normalized = Math.min(score.resilience / 25, 1);
        return `rgba(59, 130, 246, ${0.3 + normalized * 0.6})`;
      }
      case "paradox": {
        // Orange gradient - higher ratio = more paradox
        const normalized = Math.min(score.generatorRatio, 1);
        return `rgba(249, 115, 22, ${0.3 + normalized * 0.6})`;
      }
      case "equity": {
        // Purple gradient - higher rate = more electrification equity
        const equityRate = (score as { equityRate?: number }).equityRate ?? 0;
        const normalized = Math.min(equityRate / 0.5, 1);  // Scale 0-0.5%
        return `rgba(168, 85, 247, ${0.3 + normalized * 0.6})`;
      }
      default:
        return "rgba(255,255,255,0.1)";
    }
  };

  // Get score value for display
  const getScoreValue = (district: number): string => {
    const score = districtScores[district];
    if (!score) return "N/A";

    switch (viewMode) {
      case "electrification":
        return score.electrification.toFixed(1);
      case "stress":
        return score.gridStress > 0 ? `+${score.gridStress.toFixed(1)}` : score.gridStress.toFixed(1);
      case "resilience":
        return score.resilience.toFixed(1);
      case "paradox":
        return score.generatorRatio.toFixed(2);
      case "equity": {
        const equityRate = (score as { equityRate?: number }).equityRate ?? 0;
        return `${equityRate.toFixed(3)}%`;
      }
      default:
        return score.total.toString();
    }
  };

  // Get score label
  const getScoreLabel = (): string => {
    switch (viewMode) {
      case "electrification": return "Electrification Score";
      case "stress": return "Grid Stress";
      case "resilience": return "Resilience Score";
      case "paradox": return "Generator Ratio";
      case "equity": return "Electrification Rate";
      default: return "Permits";
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {mapError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm border border-red-500/30 z-50 max-w-md">
          <p className="font-medium">Map Error:</p>
          <p className="text-xs">{mapError}</p>
        </div>
      )}
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onError={(e) => {
          console.error("Mapbox error:", e);
          setMapError(e.error?.message || "Unknown map error");
        }}
        onLoad={() => {
          console.log("Map loaded successfully");
          setMapError(null);
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* District circles for heatmap views */}
        {viewMode !== "points" && Object.entries(districtCentroids).map(([d, centroid]) => {
          const district = Number(d);
          const score = districtScores[district];
          const isHighlighted = !highlightDistrict || highlightDistrict === district;

          return (
            <Marker
              key={`district-${district}`}
              latitude={centroid.lat}
              longitude={centroid.lng}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedDistrict(district);
              }}
            >
              <div
                className={`flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
                  isHighlighted ? "opacity-100" : "opacity-30"
                }`}
                style={{
                  width: 60 + (score?.total || 0) * 3,
                  height: 60 + (score?.total || 0) * 3,
                  borderRadius: "50%",
                  backgroundColor: getDistrictColor(district),
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                <div className="text-center">
                  <div className="text-white font-bold text-lg">{getScoreValue(district)}</div>
                  <div className="text-white/60 text-xs">D{district}</div>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Individual permit markers (only in points mode) */}
        {viewMode === "points" && filteredPermits.map((permit) => {
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

        {/* Permit popup */}
        {selectedPermit && viewMode === "points" && (
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

        {/* District popup */}
        {selectedDistrict && viewMode !== "points" && (
          <Popup
            latitude={districtCentroids[selectedDistrict].lat}
            longitude={districtCentroids[selectedDistrict].lng}
            anchor="bottom"
            onClose={() => setSelectedDistrict(null)}
            closeButton={true}
            closeOnClick={false}
            className="permit-popup"
          >
            <div className="p-3 min-w-[220px]">
              <div className="font-medium text-gray-900 mb-2">
                District {selectedDistrict} - {districtCentroids[selectedDistrict].name}
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {getScoreLabel()}: {getScoreValue(selectedDistrict)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-1 bg-gray-100 rounded">
                  <div className="font-medium">{districtScores[selectedDistrict]?.breakdown.solar || 0}</div>
                  <div className="text-gray-500">Solar</div>
                </div>
                <div className="text-center p-1 bg-gray-100 rounded">
                  <div className="font-medium">{districtScores[selectedDistrict]?.breakdown.ev || 0}</div>
                  <div className="text-gray-500">EV</div>
                </div>
                <div className="text-center p-1 bg-gray-100 rounded">
                  <div className="font-medium">{districtScores[selectedDistrict]?.breakdown.battery || 0}</div>
                  <div className="text-gray-500">Battery</div>
                </div>
                <div className="text-center p-1 bg-gray-100 rounded">
                  <div className="font-medium">{districtScores[selectedDistrict]?.breakdown.generator || 0}</div>
                  <div className="text-gray-500">Generator</div>
                </div>
                <div className="text-center p-1 bg-gray-100 rounded">
                  <div className="font-medium">{districtScores[selectedDistrict]?.breakdown.adu || 0}</div>
                  <div className="text-gray-500">ADU</div>
                </div>
                <div className="text-center p-1 bg-gray-100 rounded">
                  <div className="font-medium">{districtScores[selectedDistrict]?.breakdown.panel || 0}</div>
                  <div className="text-gray-500">Panel</div>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Data source indicator */}
      {hasRealData && viewMode !== "points" && (
        <div className="absolute top-4 left-4 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs border border-green-500/30">
          Live Data
        </div>
      )}

      {/* Score Legend */}
      {viewMode !== "points" && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <p className="text-xs text-white/60 mb-2">{getScoreLabel()}</p>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 rounded-full" style={{
              background: viewMode === "electrification" ? "linear-gradient(to right, rgba(34,197,94,0.3), rgba(34,197,94,0.9))" :
                         viewMode === "stress" ? "linear-gradient(to right, rgba(34,197,94,0.9), rgba(239,68,68,0.9))" :
                         viewMode === "resilience" ? "linear-gradient(to right, rgba(59,130,246,0.3), rgba(59,130,246,0.9))" :
                         viewMode === "equity" ? "linear-gradient(to right, rgba(168,85,247,0.3), rgba(168,85,247,0.9))" :
                         "linear-gradient(to right, rgba(249,115,22,0.3), rgba(249,115,22,0.9))"
            }} />
            <span className="text-xs text-white/60">
              {viewMode === "stress" ? "Surplus → Stressed" :
               viewMode === "equity" ? "Low Equity → High Equity" : "Low → High"}
            </span>
          </div>
          {viewMode === "equity" && (
            <p className="text-xs text-white/40 mt-2">Energy permits ÷ Total permits</p>
          )}
        </div>
      )}

      {/* Legend - only show if showLegend is true and in points mode */}
      {showLegend && viewMode === "points" && (
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
