"use client";

import { Check, MapPin } from "lucide-react";
import type { GeoData, SignalType } from "@/lib/chat-schema";
import { MiniMap } from "../MiniMap";

interface MapCardProps {
  id: string;
  title?: string;
  geoData: GeoData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const SIGNAL_LABELS: Record<SignalType, string> = {
  ev: "EV Chargers",
  solar: "Solar",
  battery: "Batteries",
  adu: "ADUs",
  generator: "Generators",
  panel: "Panel Upgrades",
  all: "All Permits",
};

export function MapCard({ id, title, geoData, isSelected, onSelect }: MapCardProps) {
  const signalLabel = geoData.signal ? SIGNAL_LABELS[geoData.signal] : "Geographic View";
  const districtCount = geoData.districts?.length || 0;

  return (
    <div
      className={`
        flex-shrink-0 w-72 h-[480px] rounded-2xl border transition-all
        flex flex-col overflow-hidden
        ${isSelected
          ? "border-white/40 bg-white/10 ring-2 ring-white/20"
          : "border-white/10 bg-white/5 hover:border-white/20"
        }
      `}
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-white/50" />
          <span className="text-xs text-white/50 uppercase tracking-wider">Map</span>
        </div>
        <h3 className="text-sm font-medium text-white mt-2">
          {title || signalLabel}
        </h3>
        {districtCount > 0 && (
          <p className="text-xs text-white/40 mt-1">
            {districtCount} district{districtCount !== 1 ? "s" : ""} highlighted
          </p>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 px-3">
        <div className="h-full rounded-xl overflow-hidden">
          <MiniMap geoData={geoData} />
        </div>
      </div>

      {/* Footer - Selection */}
      <div className="p-4 border-t border-white/10 mt-3">
        <button
          onClick={() => onSelect(id)}
          className={`
            w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all
            ${isSelected
              ? "bg-white text-black"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }
          `}
        >
          {isSelected ? (
            <>
              <Check size={14} />
              <span className="text-sm">Selected</span>
            </>
          ) : (
            <span className="text-sm">Select</span>
          )}
        </button>
      </div>
    </div>
  );
}
