"use client";

import { useState, useEffect } from "react";
import { Battery, AlertTriangle, Users, BarChart3, ArrowRight, Sun, Snowflake, TrendingUp, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic imports for charts and map
const MiniChart = dynamic(() => import("@/components/MiniChart").then(m => ({ default: m.MiniChart })), { ssr: false });
const ZipHeatmap = dynamic(() => import("@/components/ZipHeatmap").then(m => ({ default: m.ZipHeatmap })), { ssr: false });
const SimpleMap = dynamic(() => import("@/components/SimpleMap").then(m => ({ default: m.SimpleMap })), { ssr: false });

type Tab = "storage" | "surge" | "divide" | "overview";

const TABS: { id: Tab; label: string; icon: typeof Battery }[] = [
  { id: "overview", label: "Key Findings", icon: BarChart3 },
  { id: "storage", label: "Solar vs Storage", icon: Battery },
  { id: "surge", label: "Post-2021 Generators", icon: AlertTriangle },
  { id: "divide", label: "Generators by Neighborhood", icon: Users },
];


// Trends data from API
interface TrendsData {
  monthly: Array<{
    month: string;
    total: number;
    solar: number;
    battery: number;
    ev_charger: number;
    generator: number;
  }>;
  yearly?: Array<{
    year: number;
    total: number;
    solar: number;
    battery: number;
    generator: number;
  }>;
}

// Aggregate monthly data into yearly
function aggregateYearly(monthly: TrendsData["monthly"]) {
  const yearMap = new Map<number, { total: number; solar: number; battery: number; generator: number; ev: number }>();
  
  for (const m of monthly) {
    const year = parseInt(m.month.split("-")[0]);
    if (!yearMap.has(year)) {
      yearMap.set(year, { total: 0, solar: 0, battery: 0, generator: 0, ev: 0 });
    }
    const y = yearMap.get(year)!;
    y.total += m.total;
    y.solar += m.solar;
    y.battery += m.battery;
    y.generator += m.generator;
    y.ev += m.ev_charger;
  }
  
  return Array.from(yearMap.entries())
    .map(([year, data]) => ({ year, ...data }))
    .sort((a, b) => a.year - b.year);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [yearlyData, setYearlyData] = useState<ReturnType<typeof aggregateYearly>>([]);

  useEffect(() => {
    fetch("/api/trends")
      .then(res => res.json())
      .then((data: TrendsData) => {
        setTrends(data);
        setYearlyData(aggregateYearly(data.monthly));
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Data Insights</p>
          <h1 className="text-3xl font-bold mb-2">What the Permits Reveal</h1>
          <p className="text-white/50">Key findings from analyzing Austin construction permits. <span className="text-white/25">· Updated nightly</span></p>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === id
                    ? "border-white text-white"
                    : "border-transparent text-white/50 hover:text-white/70"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {activeTab === "overview" && <Overview yearlyData={yearlyData} />}
        {activeTab === "storage" && <EnergyStorage />}
        {activeTab === "surge" && <GeneratorSurge />}
        {activeTab === "divide" && <InfrastructureDivide />}
      </div>
    </div>
  );
}

function Overview({ yearlyData }: { yearlyData: Array<{ year: number; total: number; solar: number; battery: number; generator: number; ev: number }> }) {
  // Use live data if available, otherwise fall back to sample
  const permitTrendsData = yearlyData.length > 0 
    ? yearlyData.filter(y => y.year >= 2020).map(y => ({ name: y.year.toString(), value: y.total }))
    : [
        { name: "2020", value: 156000 },
        { name: "2021", value: 189000 },
        { name: "2022", value: 234000 },
        { name: "2023", value: 267000 },
        { name: "2024", value: 245000 },
        { name: "2025", value: 278000 },
      ];

  const latestYear = yearlyData.length > 0 ? yearlyData[yearlyData.length - 1] : null;
  const energyData = latestYear 
    ? [
        { name: "Solar", value: latestYear.solar },
        { name: "Generator", value: latestYear.generator },
        { name: "EV", value: latestYear.ev },
        { name: "Battery", value: latestYear.battery },
      ]
    : [
        { name: "Solar", value: 26075 },
        { name: "Generator", value: 7459 },
        { name: "EV", value: 3714 },
        { name: "Battery", value: 2874 },
      ];

  const findings = [
    {
      stat: "9:1",
      label: "Solar to Battery Ratio",
      insight: "Austin generates clean energy but can't store it.",
      color: "amber",
      filter: "battery"
    },
    {
      stat: "+340%",
      label: "Generator Permits Post-2021",
      insight: "Grid trust collapsed after Winter Storm Uri.",
      color: "red",
      filter: "generator"
    },
    {
      stat: "12×",
      label: "Westlake vs East Austin",
      insight: "Wealthy areas prepared. Others couldn't.",
      color: "blue",
      filter: "generator"
    },
    {
      stat: "26,075",
      label: "Solar Installations",
      insight: "Clean energy adoption is accelerating.",
      color: "yellow",
      filter: "solar"
    },
  ];

  // Chart data for overview
  const permitTrends = {
    type: "line" as const,
    title: "Annual Permit Volume",
    data: permitTrendsData,
  };

  const energyBreakdown = {
    type: "bar" as const,
    title: `Energy Infrastructure (${latestYear?.year || 2024})`,
    data: energyData,
  };

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {findings.map((f) => {
          const colors: Record<string, string> = {
            amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            red: "text-red-400 bg-red-500/10 border-red-500/20",
            blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
            yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
          };
          const [textColor, bgColor, borderColor] = colors[f.color].split(" ");
          return (
            <Link
              key={f.stat}
              href={`/dashboard?filter=${f.filter}`}
              className={`p-6 rounded-xl border ${borderColor} ${bgColor} hover:brightness-110 transition-all group`}
            >
              <div className={`text-4xl font-bold ${textColor} mb-2`}>{f.stat}</div>
              <div className="text-white font-medium mb-1">{f.label}</div>
              <div className="text-white/50 text-sm mb-4">{f.insight}</div>
              <div className="flex items-center gap-1 text-white/30 text-xs group-hover:text-white/50">
                Explore data <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <MiniChart chartData={permitTrends} />
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <MiniChart chartData={energyBreakdown} />
        </div>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <div className="p-3 bg-white/[0.02] border-b border-white/5">
          <p className="text-sm text-white/60 font-medium">Energy Infrastructure Across Austin</p>
        </div>
        <SimpleMap markers={SAMPLE_MAP_DATA} height={350} filter="all" />
      </div>

      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
        <p className="text-white/40 text-sm">
          Source: Austin Open Data Portal • Processed with NVIDIA Jetson • Updated nightly at 2AM CT
        </p>
      </div>
    </div>
  );
}

// Sample data for maps
const SAMPLE_MAP_DATA = [
  { id: "1", lat: 30.267, lng: -97.743, signal: "solar" as const, description: "Downtown Solar", zip: "78701", cluster: 0 },
  { id: "2", lat: 30.295, lng: -97.742, signal: "ev" as const, description: "North Central EV", zip: "78751", cluster: 1 },
  { id: "3", lat: 30.245, lng: -97.765, signal: "battery" as const, description: "South Battery", zip: "78704", cluster: 2 },
  { id: "4", lat: 30.315, lng: -97.728, signal: "generator" as const, description: "Hyde Park Gen", zip: "78751", cluster: 1 },
  { id: "5", lat: 30.278, lng: -97.808, signal: "solar" as const, description: "Westlake Solar", zip: "78746", cluster: 3 },
  { id: "6", lat: 30.352, lng: -97.756, signal: "solar" as const, description: "North Austin Solar", zip: "78758", cluster: 4 },
  { id: "7", lat: 30.228, lng: -97.755, signal: "generator" as const, description: "South Gen", zip: "78745", cluster: 5 },
  { id: "8", lat: 30.263, lng: -97.695, signal: "ev" as const, description: "East EV", zip: "78702", cluster: 6 },
  { id: "9", lat: 30.389, lng: -97.724, signal: "solar" as const, description: "Pflugerville Solar", zip: "78660", cluster: 7 },
  { id: "10", lat: 30.298, lng: -97.823, signal: "battery" as const, description: "West Battery", zip: "78746", cluster: 3 },
];

// Solar & Battery data
const SOLAR_BATTERY_DATA = [
  { id: "s1", lat: 30.389, lng: -97.724, signal: "solar" as const, description: "Pflugerville Solar Array", zip: "78660", cluster: 0 },
  { id: "s2", lat: 30.352, lng: -97.756, signal: "solar" as const, description: "North Austin Solar", zip: "78758", cluster: 1 },
  { id: "s3", lat: 30.228, lng: -97.755, signal: "solar" as const, description: "South Austin Solar", zip: "78745", cluster: 2 },
  { id: "s4", lat: 30.278, lng: -97.808, signal: "solar" as const, description: "Westlake Solar", zip: "78746", cluster: 3 },
  { id: "s5", lat: 30.315, lng: -97.728, signal: "solar" as const, description: "Hyde Park Solar", zip: "78751", cluster: 1 },
  { id: "s6", lat: 30.267, lng: -97.743, signal: "solar" as const, description: "Downtown Solar", zip: "78701", cluster: 0 },
  { id: "s7", lat: 30.263, lng: -97.695, signal: "solar" as const, description: "East Austin Solar", zip: "78702", cluster: 4 },
  { id: "b1", lat: 30.298, lng: -97.823, signal: "battery" as const, description: "Westlake Battery", zip: "78746", cluster: 3 },
  { id: "b2", lat: 30.245, lng: -97.765, signal: "battery" as const, description: "South Battery", zip: "78704", cluster: 2 },
];

// Generator data - concentrated in wealthy areas
const GENERATOR_DATA = [
  { id: "g1", lat: 30.298, lng: -97.823, signal: "generator" as const, description: "Westlake Generator", zip: "78746", cluster: 0 },
  { id: "g2", lat: 30.285, lng: -97.815, signal: "generator" as const, description: "Westlake Generator", zip: "78746", cluster: 0 },
  { id: "g3", lat: 30.291, lng: -97.808, signal: "generator" as const, description: "Westlake Generator", zip: "78746", cluster: 0 },
  { id: "g4", lat: 30.305, lng: -97.795, signal: "generator" as const, description: "Tarrytown Generator", zip: "78703", cluster: 1 },
  { id: "g5", lat: 30.312, lng: -97.788, signal: "generator" as const, description: "Tarrytown Generator", zip: "78703", cluster: 1 },
  { id: "g6", lat: 30.345, lng: -97.785, signal: "generator" as const, description: "NW Hills Generator", zip: "78731", cluster: 2 },
  { id: "g7", lat: 30.338, lng: -97.778, signal: "generator" as const, description: "NW Hills Generator", zip: "78731", cluster: 2 },
  { id: "g8", lat: 30.263, lng: -97.695, signal: "generator" as const, description: "East Austin Generator", zip: "78702", cluster: 3 },
];

function EnergyStorage() {
  const solarTrend = {
    type: "line" as const,
    title: "Solar Installations by Year",
    data: [
      { name: "2019", value: 3245 },
      { name: "2020", value: 4102 },
      { name: "2021", value: 5234 },
      { name: "2022", value: 6123 },
      { name: "2023", value: 7278 },
      { name: "2024", value: 8156 },
      { name: "2025", value: 8923 },
    ]
  };

  const comparisonData = {
    type: "bar" as const,
    title: "Solar vs Battery Permits",
    data: [
      { name: "Solar", value: 26075 },
      { name: "Battery", value: 2874 },
    ]
  };

  return (
    <div className="space-y-8">
      {/* Hero stat */}
      <div className="text-center py-8">
        <div className="text-7xl md:text-8xl font-bold text-amber-400 mb-2">9:1</div>
        <div className="text-xl text-white/70">Solar to Battery Ratio</div>
        <div className="text-xs text-white/20 mt-2">as of last pipeline run</div>
      </div>

      {/* Visual comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <Sun className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <div className="text-4xl font-bold text-amber-400 mb-1">26,075</div>
          <div className="text-white/60">Solar Installations</div>
        </div>
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 text-center">
          <Battery className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <div className="text-4xl font-bold text-white/30 mb-1">2,874</div>
          <div className="text-white/40">Battery Storage Permits</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <MiniChart chartData={solarTrend} />
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <MiniChart chartData={comparisonData} />
        </div>
      </div>

      {/* Explanation */}
      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
        <h3 className="font-semibold mb-3">Why This Matters</h3>
        <p className="text-white/60 leading-relaxed">
          Austin is rapidly adopting solar energy, but battery storage infrastructure lags far behind.
          During peak demand or grid failures, this imbalance means solar-generated power goes unused
          while residents still face blackouts.
        </p>
        <p className="text-white/30 text-xs mt-3">Data snapshot from initial pipeline analysis. Figures may differ from latest nightly run.</p>
      </div>

      {/* Map and Heatmap side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden border border-amber-500/20 h-[320px]">
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20">
            <p className="text-sm text-amber-400 font-medium">Solar & Battery Locations</p>
          </div>
          <SimpleMap markers={SOLAR_BATTERY_DATA} height={270} filter={["solar", "battery"]} />
        </div>
        <div className="rounded-xl overflow-hidden border border-amber-500/20 h-[320px] p-4">
          <p className="text-sm text-amber-400 font-medium mb-3">Permits by ZIP Code</p>
          <ZipHeatmap
            colorScale="amber"
            data={[
              { zip: "78660", value: 2834 },
              { zip: "78745", value: 2156 },
              { zip: "78748", value: 1987 },
              { zip: "78704", value: 1823 },
              { zip: "78753", value: 1654 },
              { zip: "78749", value: 1432 },
              { zip: "78758", value: 1289 },
              { zip: "78759", value: 1198 },
              { zip: "78746", value: 1087 },
              { zip: "78731", value: 976 },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard?filter=battery"
          className="flex-1 flex items-center justify-center gap-2 p-4 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition-colors"
        >
          View on Map <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/story?q=Why%20is%20battery%20storage%20so%20low%20compared%20to%20solar%20in%20Austin"
          className="flex-1 flex items-center justify-center gap-2 p-4 bg-white/10 text-white border border-white/20 rounded-lg font-medium hover:bg-white/20 transition-colors"
        >
          Ask About This <Sparkles className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function GeneratorSurge() {
  const generatorTrend = {
    type: "bar" as const,
    title: "Generator Permits by Year",
    data: [
      { name: "2019", value: 278 },
      { name: "2020", value: 312 },
      { name: "2021", value: 1373 },
      { name: "2022", value: 1856 },
      { name: "2023", value: 1934 },
      { name: "2024", value: 1420 },
      { name: "2025", value: 1587 },
    ]
  };

  const districtData = {
    type: "bar" as const,
    title: "Generators by Council District",
    data: [
      { name: "D10", value: 2151 },
      { name: "D8", value: 1423 },
      { name: "D6", value: 987 },
      { name: "D4", value: 412 },
      { name: "D1", value: 175 },
    ]
  };

  return (
    <div className="space-y-8">
      {/* Hero stat */}
      <div className="text-center py-8">
        <div className="text-7xl md:text-8xl font-bold text-red-400 mb-2">+340%</div>
        <div className="text-xl text-white/70">Generator Permits After 2021</div>
        <div className="text-xs text-white/20 mt-2">as of last pipeline run</div>
      </div>

      {/* Context */}
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-3 mb-3">
          <Snowflake className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">Winter Storm Uri • February 2021</span>
        </div>
        <p className="text-white/60">
          The freeze exposed Texas grid vulnerabilities. Millions lost power for days.
          Austin residents responded by installing backup generators at unprecedented rates.
        </p>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <MiniChart chartData={generatorTrend} />
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <MiniChart chartData={districtData} />
        </div>
      </div>

      {/* Before/After */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <div className="text-white/40 text-sm mb-2">2020 (Before)</div>
          <div className="text-3xl font-bold text-white/50">312</div>
          <div className="text-white/30 text-sm">permits</div>
        </div>
        <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <div className="text-white/40 text-sm mb-2">2021 (After)</div>
          <div className="text-3xl font-bold text-red-400">1,373</div>
          <div className="text-red-400/60 text-sm">+340% increase</div>
        </div>
      </div>

      {/* Note */}
      <div className="p-4 rounded-lg border-l-4 border-red-500 bg-white/[0.02]">
        <p className="text-white/60 text-sm italic">
          Not everyone can afford backup power. The surge concentrated in neighborhoods
          that could afford the $5,000&ndash;$15,000 investment.
        </p>
        <p className="text-white/30 text-xs mt-2">Data snapshot from initial pipeline analysis. Figures may differ from latest nightly run.</p>
      </div>

      {/* Map and Heatmap side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden border border-red-500/20 h-[320px]">
          <div className="p-3 bg-red-500/10 border-b border-red-500/20">
            <p className="text-sm text-red-400 font-medium">Generator Locations</p>
          </div>
          <SimpleMap markers={GENERATOR_DATA} height={270} filter="generator" />
        </div>
        <div className="rounded-xl overflow-hidden border border-red-500/20 h-[320px] p-4">
          <p className="text-sm text-red-400 font-medium mb-3">Permits by ZIP Code</p>
          <ZipHeatmap
            colorScale="red"
            data={[
              { zip: "78746", value: 892 },
              { zip: "78731", value: 654 },
              { zip: "78735", value: 543 },
              { zip: "78703", value: 487 },
              { zip: "78749", value: 398 },
              { zip: "78759", value: 312 },
              { zip: "78748", value: 287 },
              { zip: "78745", value: 234 },
              { zip: "78758", value: 198 },
              { zip: "78757", value: 156 },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard?filter=generator"
          className="flex-1 flex items-center justify-center gap-2 p-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-400 transition-colors"
        >
          View on Map <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/story?q=What%20happened%20to%20generator%20permits%20after%20Winter%20Storm%20Uri"
          className="flex-1 flex items-center justify-center gap-2 p-4 bg-white/10 text-white border border-white/20 rounded-lg font-medium hover:bg-white/20 transition-colors"
        >
          Ask About This <Sparkles className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function InfrastructureDivide() {
  const incomeCorrelation = {
    type: "bar" as const,
    title: "Generators by Median Income Area",
    data: [
      { name: "$150k+", value: 2151 },
      { name: "$100-150k", value: 1423 },
      { name: "$75-100k", value: 654 },
      { name: "$50-75k", value: 312 },
      { name: "<$50k", value: 175 },
    ]
  };

  const yearlyGap = {
    type: "line" as const,
    title: "Gap Widening Over Time",
    data: [
      { name: "2021", value: 8.2 },
      { name: "2022", value: 9.5 },
      { name: "2023", value: 11.3 },
      { name: "2024", value: 12.3 },
      { name: "2025", value: 13.1 },
    ]
  };

  return (
    <div className="space-y-8">
      {/* Context intro */}
      <div className="p-6 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <h3 className="text-lg font-semibold text-blue-400 mb-3">Generator Distribution by Area</h3>
        <p className="text-white/70 leading-relaxed">
          Following Winter Storm Uri in 2021, generator permit applications increased across Austin.
          The data shows significant variation by neighborhood, with installation rates correlating
          with median household income. Typical generator installations cost <span className="text-white font-medium">$5,000–$15,000</span>.
        </p>
      </div>

      {/* Hero comparison */}
      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-8 rounded-l-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <div className="text-white/40 text-sm mb-2">District 10 / Westlake</div>
          <div className="text-xs text-white/30 mb-4">Median income: $180k+</div>
          <div className="text-6xl font-bold text-blue-400 mb-2">2,151</div>
          <div className="text-white/60">generators since 2021</div>
        </div>
        <div className="p-8 rounded-r-xl bg-white/[0.02] border border-white/10 text-center">
          <div className="text-white/40 text-sm mb-2">District 1 / East Austin</div>
          <div className="text-xs text-white/30 mb-4">Median income: $45k</div>
          <div className="text-6xl font-bold text-white/30 mb-2">175</div>
          <div className="text-white/40">generators since 2021</div>
        </div>
      </div>

      {/* Multiplier */}
      <div className="text-center">
        <span className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 font-bold">
          12× Difference in Backup Power Access
        </span>
        <div className="text-xs text-white/20 mt-2">as of last pipeline run</div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <MiniChart chartData={incomeCorrelation} />
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <MiniChart chartData={yearlyGap} />
        </div>
      </div>

      {/* Summary */}
      <div className="py-4 text-center">
        <p className="text-lg text-white/50">
          Permit data shows clear geographic patterns in backup power adoption.
        </p>
        <p className="text-white/30 text-xs mt-2">Data snapshot from initial pipeline analysis. District-level figures may differ from latest nightly run.</p>
      </div>

      {/* District breakdown */}
      <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold">By Council District</h3>
        </div>
        <div className="space-y-2">
          {[
            { district: "D10 (Westlake)", count: 2151, pct: 100 },
            { district: "D8 (SW Austin)", count: 1423, pct: 66 },
            { district: "D6 (NW Austin)", count: 987, pct: 46 },
            { district: "D4 (E Central)", count: 412, pct: 19 },
            { district: "D1 (East Austin)", count: 175, pct: 8 },
          ].map((d) => (
            <div key={d.district} className="flex items-center gap-3">
              <div className="w-28 text-sm text-white/60">{d.district}</div>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${d.pct}%` }} />
              </div>
              <div className="w-16 text-right text-sm font-mono">{d.count.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map and Heatmap side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden border border-blue-500/20 h-[320px]">
          <div className="p-3 bg-blue-500/10 border-b border-blue-500/20">
            <p className="text-sm text-blue-400 font-medium">The Divide Visualized</p>
          </div>
          <SimpleMap markers={GENERATOR_DATA} height={270} filter="generator" />
        </div>
        <div className="rounded-xl overflow-hidden border border-blue-500/20 h-[320px] p-4">
          <p className="text-sm text-blue-400 font-medium mb-3">Investment by ZIP Code</p>
          <ZipHeatmap
            colorScale="blue"
            data={[
              { zip: "78746", value: 1243 },
              { zip: "78731", value: 987 },
              { zip: "78735", value: 876 },
              { zip: "78703", value: 743 },
              { zip: "78749", value: 654 },
              { zip: "78759", value: 598 },
              { zip: "78748", value: 487 },
              { zip: "78745", value: 398 },
              { zip: "78702", value: 76 },
              { zip: "78701", value: 45 },
            ]}
          />
        </div>
      </div>

      {/* Data insights */}
      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="font-semibold">Data Insights</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-white/[0.02]">
            <div className="text-blue-400 font-medium mb-2">12× Range</div>
            <p className="text-white/60">Generator installations vary 12× between highest and lowest districts.</p>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.02]">
            <div className="text-blue-400 font-medium mb-2">Income Correlation</div>
            <p className="text-white/60">Districts with higher median incomes show proportionally higher generator permits.</p>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.02]">
            <div className="text-blue-400 font-medium mb-2">Geographic Pattern</div>
            <p className="text-white/60">West Austin districts (D10, D8) lead in installations; East Austin (D1, D4) has fewer.</p>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.02]">
            <div className="text-blue-400 font-medium mb-2">Trend Continuing</div>
            <p className="text-white/60">The gap between high and low-installation areas has widened each year since 2021.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard?filter=generator"
          className="flex-1 flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
        >
          View on Map <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/story?q=Which%20Austin%20neighborhoods%20have%20the%20most%20generators"
          className="flex-1 flex items-center justify-center gap-2 p-4 bg-white/10 text-white border border-white/20 rounded-lg font-medium hover:bg-white/20 transition-colors"
        >
          Ask About This <Sparkles className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
