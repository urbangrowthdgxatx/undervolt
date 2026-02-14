"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Github, AlertTriangle, Database, BarChart3, Trophy, Map, MessageSquare, FileBarChart } from "lucide-react";

export default function HomePage() {
  const [dataDate, setDataDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => {
        if (data.dateRange?.latest) {
          setDataDate(new Date(data.dateRange.latest).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
        }
      })
      .catch(() => {});
  }, []);

  const categories = [
    "Solar",
    "Battery Storage",
    "EV Chargers",
    "Generators",
    "Grid Infrastructure",
    "Renovations",
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col">
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-4xl text-center">
            {/* Award Badge */}
            <a href="https://www.linkedin.com/feed/update/urn:li:activity:7406954775415554051/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 mb-6 hover:border-amber-500/60 transition-colors">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-300 font-medium">1st Place Urban Growth - NVIDIA DGX AITX Hackathon · Dec 2025</span>
            </a>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Urban infrastructure intelligence
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-6 max-w-md mx-auto">
              GPU-accelerated analysis of 2.34M Austin construction permits, processed nightly. Discover energy trends, grid gaps, and infrastructure patterns.
            </p>

            {/* Categories */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-12">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-white/60"
                >
                  {cat}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6 mb-24">
              <Link
                href="/explore"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
              >
                <Map className="w-4 h-4" />
                Explore Map
              </Link>
              <Link
                href="/story"
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg font-medium hover:bg-white/15 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Ask Undervolt
              </Link>
              <Link
                href="/reports"
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-lg font-medium hover:bg-white/15 transition-colors"
              >
                <FileBarChart className="w-4 h-4" />
                View Reports
              </Link>
            </div>

            {/* Tech Stack - Animated */}
            <div className="relative overflow-hidden w-full max-w-lg mx-auto mt-6" style={{ maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)" }}>
              <div className="flex animate-marquee gap-14 whitespace-nowrap">
              {/* NVIDIA */}
              <a href="https://developer.nvidia.com/embedded/jetson-agx-orin" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
                <img src="/nvidia-logo.png" alt="NVIDIA" className="w-14 h-8 object-contain rounded" />
                <span className="text-xs text-white/50">NVIDIA</span>
              </a>

              {/* Ollama */}
              <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
                <img src="/ollama.png" alt="Ollama" className="w-8 h-8 rounded invert" />
                <span className="text-xs text-white/50">Ollama</span>
              </a>

              {/* Supabase */}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 109 113" fill="none">
                  <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#sb1)"/>
                  <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
                  <defs><linearGradient id="sb1" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse"><stop stopColor="#249361"/><stop offset="1" stopColor="#3ECF8E"/></linearGradient></defs>
                </svg>
                <span className="text-xs text-white/50">Supabase</span>
              </a>

              {/* Next.js */}
              <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.251 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/>
                </svg>
                <span className="text-xs text-white/50">Next.js</span>
              </a>

              {/* Vercel */}
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 19.5h20L12 2z"/>
                </svg>
                <span className="text-xs text-white/50">Vercel</span>
              </a>
              </div>
          </div>
        </div>
      </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Problem Section */}
      <section className="py-24 px-8 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase mb-4 block">The Problem</span>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Infrastructure signals are hiding in{" "}
                <span className="text-white/40">plain sight.</span>
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">The Permitting Bottleneck</h3>
                  <p className="text-white/50">Manual analysis of Austin's construction data is slow, fragmented, and prone to human error.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Hidden Trends</h3>
                  <p className="text-white/50">Critical infrastructure trends are buried under a mountain of bureaucratic paperwork and legacy PDF formats.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">The 2.3M Scale Challenge</h3>
                  <p className="text-white/50">Processing <span className="text-white">2.34 million permits</span> manually is an impossible task for urban planners and developers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Platform Capabilities */}
      <section className="py-20 px-8 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Platform</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4">From raw data to real-time intelligence</h2>
          </div>

          {/* Compact pipeline flow */}
          <div className="flex items-center justify-center gap-1 md:gap-2 mb-12 flex-wrap">
            {([
              { label: "Ingest", color: "text-emerald-400" },
              { label: "Process", color: "text-purple-400" },
              { label: "Analyze", color: "text-amber-400" },
              { label: "Serve", color: "text-blue-400" },
            ]).map((s, i) => (
              <div key={s.label} className="flex items-center gap-1 md:gap-2">
                {i > 0 && <ArrowRight className="w-3 h-3 text-white/20" />}
                <span className={`text-sm font-medium ${s.color}`}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Large card - Open Pipeline */}
            <div className="md:col-span-1 md:row-span-2 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-white/10 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <h3 className="font-semibold text-white">Open Pipeline</h3>
              </div>
              <p className="text-white/60 text-sm mb-4">Repeatable for <span className="text-emerald-400">any city&apos;s open data</span>. Customizable pipeline code you can fork and adapt.</p>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg className="w-12 h-12 text-emerald-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4" /></svg>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-white/40">
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Any open dataset</div>
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Customizable pipeline</div>
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> MIT licensed</div>
              </div>
              <a
                href="https://github.com/urbangrowthdgxatx/undervolt"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
            </div>

            {/* GPU-accelerated */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <h3 className="font-semibold text-white">GPU-accelerated</h3>
              </div>
              <p className="text-white/60 text-sm">Process <span className="text-amber-400">2.34M permits</span> efficiently on edge hardware.</p>
            </div>

            {/* Local LLM */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <h3 className="font-semibold text-white">Local LLM</h3>
              </div>
              <p className="text-white/60 text-sm"><span className="text-purple-400">Ollama + Nemotron 3 Nano</span> for on-device AI. No cloud APIs.</p>
            </div>

            {/* Open Source */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <h3 className="font-semibold text-white">Open Source</h3>
              </div>
              <p className="text-white/60 text-sm"><span className="text-blue-400">MIT licensed</span>. Fork it for your city, customize freely.</p>
            </div>

            {/* Story-driven */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <h3 className="font-semibold text-white">Story-driven</h3>
              </div>
              <p className="text-white/60 text-sm">Raw data → insights like the <span className="text-cyan-400">9:1</span> solar-to-battery ratio.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Built For Section */}
      <section className="py-24 px-8 bg-neutral-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Who is this for</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4">Built for decision makers</h2>
            <p className="text-white/40 mt-3 max-w-lg mx-auto">Real-time infrastructure intelligence for the people who plan, power, and study cities.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-500/30 hover:border-blue-500/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-5">
                <span className="text-3xl">🏛️</span>
              </div>
              <h3 className="font-bold text-xl mb-3 text-white group-hover:text-blue-200 transition-colors">City Planners</h3>
              <p className="text-white/50 text-sm leading-relaxed">Identify infrastructure gaps, track permit trends, and make data-driven zoning decisions across every district.</p>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 hover:border-amber-500/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center mb-5">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="font-bold text-xl mb-3 text-white group-hover:text-amber-200 transition-colors">Energy Companies</h3>
              <p className="text-white/50 text-sm leading-relaxed">Find underserved areas for solar, battery, and EV infrastructure investments. Spot the grid gaps before they become crises.</p>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/15 to-purple-500/5 border border-purple-500/30 hover:border-purple-500/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5">
                <span className="text-3xl">🔬</span>
              </div>
              <h3 className="font-bold text-xl mb-3 text-white group-hover:text-purple-200 transition-colors">Researchers</h3>
              <p className="text-white/50 text-sm leading-relaxed">Analyze urban growth patterns, climate resilience, and infrastructure equity with 26 years of permit data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Reports Callout */}
      <section className="py-24 px-8 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-amber-400 text-sm font-medium tracking-wide uppercase">Infrastructure Analysis</span>
          <h2 className="text-4xl font-bold mt-4 mb-4">Austin is Changing Fast</h2>
          <p className="text-white/50 text-lg mb-8 max-w-md mx-auto">
            Solar installations, EV chargers, generators, and grid infrastructure patterns revealed through permit data analysis.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 text-center">
              <div className="text-5xl font-bold text-amber-400 mb-2">9:1</div>
              <p className="text-white/50 text-sm">Solar to battery ratio</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 text-center">
              <div className="text-5xl font-bold text-red-400 mb-2">+340%</div>
              <p className="text-white/50 text-sm">Generator surge post-2021</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 text-center">
              <div className="text-5xl font-bold text-emerald-400 mb-2">26,075</div>
              <p className="text-white/50 text-sm">Solar installations</p>
            </div>
          </div>

          <Link
            href="/reports"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            View Reports
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Open Source CTA */}
      <section className="py-20 px-8 bg-neutral-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Open Source</h2>
          <p className="text-white/50 mb-8 text-lg">
            Extensible data pipeline. Adapt it for any city, any dataset. MIT Licensed.
          </p>
          <div className="flex items-center justify-center gap-4 mb-12">
            <a
              href="https://github.com/urbangrowthdgxatx/undervolt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          </div>

          <div className="text-white/50 text-sm">
            Data: <a href="https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2">City of Austin Open Data</a>{dataDate && <span> • Updated {dataDate}</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
