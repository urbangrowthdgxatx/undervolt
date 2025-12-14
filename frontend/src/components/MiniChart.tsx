"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChartData } from "@/lib/chat-schema";

interface MiniChartProps {
  chartData: ChartData;
}

export function MiniChart({ chartData }: MiniChartProps) {
  const { type, title, data } = chartData;

  return (
    <div className="w-full h-[140px] bg-white/5 rounded-lg p-3">
      {title && (
        <p className="text-xs text-white/50 mb-2">{title}</p>
      )}
      <div className="h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "line" ? (
            <LineChart data={data}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
                dot={{ fill: "#ffffff", r: 3 }}
              />
              {data.some(d => d.lastYear !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="lastYear"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </LineChart>
          ) : (
            <BarChart data={data} barGap={1}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#000",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: 12,
                }}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              {data.some(d => d.lastYear !== undefined) && (
                <Bar
                  dataKey="lastYear"
                  fill="rgba(255,255,255,0.2)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={20}
                />
              )}
              <Bar
                dataKey="value"
                fill="#ffffff"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
