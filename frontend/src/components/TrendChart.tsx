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
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-light">{title}</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-white rounded-sm" />
            <span>This Year</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-gray-600 rounded-sm" />
            <span>Last Year</span>
          </div>
          {showAverage && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0 border-t border-dashed border-gray-500" />
              <span>Average</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#737373", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#737373", fontSize: 12 }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            {showAverage && (
              <ReferenceLine
                y={average}
                stroke="#666"
                strokeDasharray="3 3"
              />
            )}
            <Bar
              dataKey="lastYear"
              fill="#404040"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="value"
              fill="#ffffff"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
