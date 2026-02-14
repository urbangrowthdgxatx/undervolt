"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface TrendChartProps {
  title: string;
  data: Array<{ name: string; value: number; lastYear?: number }>;
  showAverage?: boolean;
}

export function TrendChart({ title, data, showAverage = true }: TrendChartProps) {
  const average = data.reduce((acc, d) => acc + d.value, 0) / data.length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-light text-white/70">{title}</h3>
        <div className="flex items-center gap-4 text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-white rounded-sm" />
            <span>Current</span>
          </div>
          {data.some(d => d.lastYear !== undefined) && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-white/30 rounded-sm" />
              <span>Previous</span>
            </div>
          )}
          {showAverage && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0 border-t border-dashed border-white/40" />
              <span>Avg</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#000",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                color: "#fff",
              }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />
            {showAverage && (
              <ReferenceLine
                y={average}
                stroke="rgba(255,255,255,0.3)"
                strokeDasharray="3 3"
              />
            )}
            <Bar
              dataKey="lastYear"
              fill="rgba(255,255,255,0.2)"
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="value"
              fill="#ffffff"
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
