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

const COLOR_SCALES = {
  amber: { bar: "#fbbf24", bg: "rgba(251, 191, 36, 0.15)" },
  red: { bar: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
  blue: { bar: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  green: { bar: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" },
};

export function ZipHeatmap({ data, title, colorScale = "amber" }: ZipHeatmapProps) {
  const colors = COLOR_SCALES[colorScale];

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value).slice(0, 6);
  }, [data]);

  const max = sortedData[0]?.value || 1;

  return (
    <div className="h-full flex flex-col">
      {title && (
        <p className="text-sm text-white/60 mb-3 font-medium">{title}</p>
      )}

      <div className="flex-1 flex flex-col justify-center gap-2">
        {sortedData.map((item, i) => {
          const pct = (item.value / max) * 100;
          return (
            <div key={item.zip} className="flex items-center gap-3">
              <span className="text-xs text-white/50 w-12 font-mono">{item.zip}</span>
              <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: colors.bg }}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${pct}%`, 
                    background: `linear-gradient(90deg, ${colors.bar}dd, ${colors.bar})`
                  }} 
                />
              </div>
              <span className="text-xs font-semibold w-10 text-right" style={{ color: colors.bar }}>
                {item.value > 999 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
