"use client";

import { useState } from "react";
import { Zap, Sun, Battery, Home, Gauge, Building2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { TrendChart } from "@/components/TrendChart";
import { ChatInput } from "@/components/ChatInput";
import { InsightCard } from "@/components/InsightCard";

// Sample data - will be replaced with real data from API
const evTrendData = [
  { name: "Jan", value: 45, lastYear: 32 },
  { name: "Feb", value: 52, lastYear: 38 },
  { name: "Mar", value: 61, lastYear: 42 },
  { name: "Apr", value: 58, lastYear: 45 },
  { name: "May", value: 72, lastYear: 48 },
  { name: "Jun", value: 85, lastYear: 52 },
  { name: "Jul", value: 78, lastYear: 55 },
  { name: "Aug", value: 92, lastYear: 58 },
  { name: "Sep", value: 88, lastYear: 62 },
  { name: "Oct", value: 105, lastYear: 65 },
  { name: "Nov", value: 98, lastYear: 70 },
  { name: "Dec", value: 112, lastYear: 75 },
];

const suggestions = [
  "EV chargers by zip code",
  "Solar adoption trend",
  "Grid resilience map",
  "ADU hotspots",
  "Compare East vs West Austin",
];

export default function Dashboard() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const handleSubmit = (message: string) => {
    setMessages([...messages, { role: "user", content: message }]);
    // TODO: Call API and add response
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Chat */}
      <div className="w-[480px] border-r border-[#1a1a1a] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#1a1a1a]">
          <h1 className="text-2xl font-light">
            <span className="text-gray-400">Good evening,</span>{" "}
            <span className="text-white">Austin</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            here&apos;s a quick look at infrastructure trends.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-6 grid grid-cols-2 gap-3">
          <StatCard
            icon={Zap}
            label="EV Chargers"
            sublabel="Total permits extracted"
            value="775"
            change="+34%"
            changeType="positive"
            footer="vs last year"
          />
          <StatCard
            icon={Sun}
            label="Solar Installs"
            sublabel="Total permits"
            value="1,630"
            change="+28%"
            changeType="positive"
            footer="avg 18.5 kW"
          />
          <StatCard
            icon={Battery}
            label="Battery Storage"
            sublabel="Grid resilience"
            value="128"
            change="+156%"
            changeType="positive"
            footer="Tesla Powerwall dominant"
          />
          <StatCard
            icon={Home}
            label="ADUs"
            sublabel="Density signals"
            value="331"
            change="+42%"
            changeType="positive"
            footer="78704 leads"
          />
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-4 ${
                msg.role === "user" ? "text-white" : "text-gray-300"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-[#1a1a1a]">
          <ChatInput
            onSubmit={handleSubmit}
            placeholder="Ask about Austin's infrastructure..."
            suggestions={suggestions}
          />
        </div>
      </div>

      {/* Right Panel - Visualizations */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light text-gray-400">Infrastructure Overview</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Last updated: Dec 2024</span>
          </div>
        </div>

        {/* Main Chart */}
        <TrendChart
          title="EV Charger Permits by Month"
          data={evTrendData}
        />

        {/* Bottom Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard
            icon={Gauge}
            label="Panel Upgrades"
            value="3,072"
            footer="Infrastructure strain"
          />
          <StatCard
            icon={Building2}
            label="Multi-Family"
            value="4,025"
            footer="Density growth"
          />
          <StatCard
            label="Generator Permits"
            value="1,277"
            change="+47%"
            changeType="positive"
            footer="Post-freeze resilience"
          />
          <StatCard
            label="Total Permits"
            value="79,661"
            footer="In database"
          />
        </div>

        {/* Insight */}
        <div className="mt-6">
          <InsightCard title="Key Insight">
            <strong>78704 (South Austin)</strong> leads EV charger adoption with 3.2x more
            installations than the city average. Solar + battery combinations are growing
            fastest in <strong>78746 (Westlake)</strong>, indicating grid resilience
            investment correlates with higher income areas. Generator permits spiked 47%
            following the 2021 freeze.
          </InsightCard>
        </div>
      </div>
    </div>
  );
}
