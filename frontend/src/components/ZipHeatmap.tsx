"use client";

import { useMemo } from "react";

interface ZipData {
  zip: string;
  value: number;
  label?: string;
}

interface ZipHeatmapProps {
  data: ZipData[];
  title?: string;
  colorScale?: "amber" | "red" | "blue" | "green";
  maxValue?: number;
}

// Austin ZIP code positions (compact 5x5 grid)
const ZIP_POSITIONS: Record<string, { row: number; col: number }> = {
  // Row 0 - North
  "78759": { row: 0, col: 0 },
  "78758": { row: 0, col: 1 },
  "78753": { row: 0, col: 2 },
  "78660": { row: 0, col: 3 }, // Pflugerville
  "78723": { row: 0, col: 4 },
  // Row 1 - Central-North
  "78731": { row: 1, col: 0 }, // NW Hills
  "78757": { row: 1, col: 1 },
  "78751": { row: 1, col: 2 },
  "78752": { row: 1, col: 3 },
  "78702": { row: 1, col: 4 }, // East Austin
  // Row 2 - Central
  "78746": { row: 2, col: 0 }, // Westlake
  "78703": { row: 2, col: 1 },
  "78701": { row: 2, col: 2 }, // Downtown
  "78704": { row: 2, col: 3 }, // South Austin
  "78721": { row: 2, col: 4 },
  // Row 3 - South
  "78735": { row: 3, col: 0 },
  "78749": { row: 3, col: 1 },
  "78745": { row: 3, col: 2 },
  "78741": { row: 3, col: 3 },
  "78744": { row: 3, col: 4 },
  // Row 4 - Far South
  "78736": { row: 4, col: 0 },
  "78748": { row: 4, col: 1 },
  "78747": { row: 4, col: 2 },
  "78617": { row: 4, col: 3 },
  "78719": { row: 4, col: 4 },
};

const COLOR_SCALES = {
  amber: {
    low: "rgba(251, 191, 36, 0.1)",
    mid: "rgba(251, 191, 36, 0.4)",
    high: "rgba(251, 191, 36, 0.8)",
    text: "#fbbf24",
    border: "rgba(251, 191, 36, 0.3)",
  },
  red: {
    low: "rgba(239, 68, 68, 0.1)",
    mid: "rgba(239, 68, 68, 0.4)",
    high: "rgba(239, 68, 68, 0.8)",
    text: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
  },
  blue: {
    low: "rgba(59, 130, 246, 0.1)",
    mid: "rgba(59, 130, 246, 0.4)",
    high: "rgba(59, 130, 246, 0.8)",
    text: "#3b82f6",
    border: "rgba(59, 130, 246, 0.3)",
  },
  green: {
    low: "rgba(34, 197, 94, 0.1)",
    mid: "rgba(34, 197, 94, 0.4)",
    high: "rgba(34, 197, 94, 0.8)",
    text: "#22c55a",
    border: "rgba(34, 197, 94, 0.3)",
  },
};

export function ZipHeatmap({ data, title, colorScale = "amber", maxValue }: ZipHeatmapProps) {
  const colors = COLOR_SCALES[colorScale];

  const { dataMap, max } = useMemo(() => {
    const map = new Map<string, ZipData>();
    let maxVal = maxValue || 0;

    data.forEach(d => {
      map.set(d.zip, d);
      if (!maxValue && d.value > maxVal) maxVal = d.value;
    });

    return { dataMap: map, max: maxVal };
  }, [data, maxValue]);

  const getColor = (value: number) => {
    const ratio = value / max;
    if (ratio < 0.33) return colors.low;
    if (ratio < 0.66) return colors.mid;
    return colors.high;
  };

  // Create grid - compact 5x5
  const rows = 5;
  const cols = 5;

  return (
    <div>
      {title && (
        <p className="text-sm text-white/60 mb-3 font-medium">{title}</p>
      )}

      {/* Grid */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: rows * cols }).map((_, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;

          // Find ZIP at this position
          const zip = Object.entries(ZIP_POSITIONS).find(
            ([_, pos]) => pos.row === row && pos.col === col
          )?.[0];

          if (!zip) {
            return <div key={idx} className="aspect-square" />;
          }

          const zipData = dataMap.get(zip);
          const hasData = zipData && zipData.value > 0;

          return (
            <div
              key={idx}
              className="aspect-square rounded-lg flex flex-col items-center justify-center text-center p-2 transition-all hover:scale-105 cursor-default min-w-[50px]"
              style={{
                backgroundColor: hasData ? getColor(zipData.value) : "rgba(255,255,255,0.04)",
                border: hasData ? `1px solid ${colors.border}` : "1px solid rgba(255,255,255,0.08)",
              }}
              title={hasData ? `${zip}: ${zipData.value.toLocaleString()} ${zipData.label || ""}` : zip}
            >
              <span className="text-xs text-white/70 font-mono font-medium">{zip.slice(-3)}</span>
              {hasData && (
                <span className="text-sm font-bold" style={{ color: colors.text }}>
                  {zipData.value > 999 ? `${(zipData.value / 1000).toFixed(1)}k` : zipData.value}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-[10px] text-white/40">
        <span>Low</span>
        <div className="flex-1 mx-2 h-1.5 rounded-full" style={{
          background: `linear-gradient(to right, ${colors.low}, ${colors.mid}, ${colors.high})`
        }} />
        <span>High</span>
      </div>
    </div>
  );
}
