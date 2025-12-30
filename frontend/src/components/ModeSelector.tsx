"use client";

import { Compass, Search, PenTool } from "lucide-react";
import type { Mode } from "@/lib/modes";
import { MODE_CONFIG } from "@/lib/modes";

interface ModeSelectorProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

const ICONS = {
  scout: Compass,
  investigator: Search,
  editor: PenTool,
};

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
      {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => {
        const config = MODE_CONFIG[m];
        const Icon = ICONS[m];
        const isActive = mode === m;

        return (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${isActive
                ? "bg-white text-black"
                : "text-white/60 hover:text-white hover:bg-white/10"
              }
            `}
            title={config.description}
          >
            <Icon size={16} />
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
