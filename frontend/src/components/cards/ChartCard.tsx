"use client";

import { Check, BarChart3 } from "lucide-react";
import type { ChartData } from "@/lib/chat-schema";
import { MiniChart } from "../MiniChart";

interface ChartCardProps {
  id: string;
  chartData: ChartData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ChartCard({ id, chartData, isSelected, onSelect }: ChartCardProps) {
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
          <BarChart3 size={14} className="text-white/50" />
          <span className="text-xs text-white/50 uppercase tracking-wider">
            {chartData.type === "line" ? "Line Chart" : "Bar Chart"}
          </span>
        </div>
        {chartData.title && (
          <h3 className="text-sm font-medium text-white mt-2">
            {chartData.title}
          </h3>
        )}
        <p className="text-xs text-white/40 mt-1">
          {chartData.data.length} data point{chartData.data.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Chart */}
      <div className="flex-1 px-3 flex items-center">
        <div className="w-full h-[200px]">
          <MiniChart chartData={chartData} />
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
