"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Github, AlertTriangle, Database, BarChart3 } from "lucide-react";

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
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Urban infrastructure intelligence
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-6 max-w-md mx-auto">
              GPU-accelerated analysis of 2.34M Austin construction permits. Discover energy trends, grid gaps, and infrastructure patterns.
            </p>

            {/* Categories */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-white/60"
                >
                  {cat}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mb-24">
              <Link
                href="/explore"
                className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
              >
                Get Started
              </Link>
              <a
                href="https://github.com/urbangrowthdgxatx/undervolt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 text-white/70 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
                <span>GitHub</span>
              </a>
            </div>

            {/* Tech Stack - Animated */}
            <div className="relative overflow-hidden w-full max-w-sm mx-auto">
              <div className="flex animate-marquee gap-14 whitespace-nowrap">
              {/* NVIDIA */}
              <a href="https://developer.nvidia.com/embedded/jetson-agx-orin" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-40 hover:opacity-80 transition-opacity flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#76B900">
                  <path d="M11.058 12.824c-.05-.7-.15-1.4-.35-2.05-.2-.65-.5-1.25-.9-1.8-.4-.55-.9-1-1.45-1.35-.55-.35-1.2-.6-1.9-.7v2.1c.45.1.85.3 1.2.55.35.25.65.55.9.9.25.35.45.75.55 1.15.1.4.15.85.1 1.3-.05.4-.15.8-.35 1.15-.2.35-.45.65-.75.9-.3.25-.65.45-1.05.55-.4.1-.8.15-1.25.1v2.1c.7-.1 1.35-.35 1.9-.7.55-.35 1.05-.8 1.45-1.35.4-.55.7-1.15.9-1.8.2-.65.3-1.3.35-2v-.05z"/>
                  <path d="M6.058 5.824v2.1c1.1.15 2.1.55 2.95 1.15.85.6 1.55 1.4 2.05 2.35.5.95.8 2 .85 3.15.05 1.15-.15 2.25-.55 3.25-.4 1-.95 1.9-1.7 2.65-.75.75-1.6 1.35-2.6 1.75-1 .4-2.05.6-3.15.55v2.1c1.45 0 2.8-.3 4.05-.85 1.25-.55 2.35-1.3 3.25-2.25.9-.95 1.6-2.05 2.1-3.3.5-1.25.75-2.6.7-4-.05-1.4-.35-2.75-.9-4-.55-1.25-1.3-2.35-2.25-3.3-.95-.95-2.05-1.7-3.3-2.2-1.25-.5-2.6-.8-4.05-.85v.1-.05z"/>
                </svg>
                <span className="text-xs text-white/40">NVIDIA</span>
              </a>

              {/* Ollama */}
              <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-40 hover:opacity-80 transition-opacity flex-shrink-0">
                <div className="w-8 h-8 flex items-center justify-center text-2xl">🦙</div>
                <span className="text-xs text-white/40">Ollama</span>
              </a>

              {/* Supabase */}
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-40 hover:opacity-80 transition-opacity flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 109 113" fill="none">
                  <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#sb1)"/>
                  <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
                  <defs><linearGradient id="sb1" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse"><stop stopColor="#249361"/><stop offset="1" stopColor="#3ECF8E"/></linearGradient></defs>
                </svg>
                <span className="text-xs text-white/40">Supabase</span>
              </a>

              {/* Next.js */}
              <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-40 hover:opacity-80 transition-opacity flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.251 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/>
                </svg>
                <span className="text-xs text-white/40">Next.js</span>
              </a>

              {/* Vercel */}
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-40 hover:opacity-80 transition-opacity flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 19.5h20L12 2z"/>
                </svg>
                <span className="text-xs text-white/40">Vercel</span>
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

      {/* Features Bento Grid */}
      <section className="py-20 px-8 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Large card - Edge-first */}
            <div className="md:col-span-1 md:row-span-2 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-white/10 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>
                <h3 className="font-semibold text-white">Edge-first</h3>
              </div>
              <p className="text-white/60 text-sm mb-4">Runs entirely on <span className="text-emerald-400">NVIDIA Jetson</span>. Your data stays local. Zero cloud costs.</p>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg className="w-12 h-12 text-emerald-400/50" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-white/40">
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> No cloud dependency</div>
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Data sovereignty</div>
                <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Low latency queries</div>
              </div>
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
              <p className="text-white/60 text-sm"><span className="text-purple-400">Ollama + Nemotron</span> for on-device AI. No cloud APIs.</p>
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
              <p className="text-white/60 text-sm">Raw data → insights like the <span className="text-cyan-400">22:1</span> solar-to-battery ratio.</p>
            </div>

            {/* Wide card - Energy Focus */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                <h3 className="font-semibold text-white">Energy Focus</h3>
              </div>
              <p className="text-white/60 text-sm mb-4">Track grid resilience across Austin. Where are generators clustering? Who added solar after the freeze?</p>
              <div className="flex gap-4 text-xs">
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50">Solar: 25,982</div>
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50">Generators: +246%</div>
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50">EV Chargers: 3,642</div>
              </div>
            </div>

            {/* Data Pipeline card */}
            <div className="md:col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                <h3 className="font-semibold text-white">Extensible</h3>
              </div>
              <p className="text-white/60 text-sm">Adapt the pipeline for <span className="text-white">any city, any dataset</span>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Built For Section */}
      <section className="py-20 px-8 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Who is this for</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4">Built for decision makers</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-2xl mb-3">🏛️</div>
              <h3 className="font-semibold text-lg mb-2">City Planners</h3>
              <p className="text-white/50 text-sm">Identify infrastructure gaps, track permit trends, and make data-driven zoning decisions.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Energy Companies</h3>
              <p className="text-white/50 text-sm">Find underserved areas for solar, battery, and EV infrastructure investments.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-2xl mb-3">🔬</div>
              <h3 className="font-semibold text-lg mb-2">Researchers</h3>
              <p className="text-white/50 text-sm">Analyze urban growth patterns, climate resilience, and infrastructure equity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Reports Callout */}
      <section className="py-24 px-8 bg-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-amber-400 text-sm font-medium tracking-wide uppercase">Infrastructure Analysis</span>
          <h2 className="text-4xl font-bold mt-4 mb-4">Austin is Changing Fast</h2>
          <p className="text-white/50 text-lg mb-8 max-w-md mx-auto">
            Solar installations, EV chargers, generators, and grid infrastructure patterns revealed through permit data analysis.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 text-center">
              <div className="text-3xl font-bold text-amber-400 mb-2">22:1</div>
              <p className="text-white/50 text-sm">Solar to battery ratio</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">+246%</div>
              <p className="text-white/50 text-sm">Generator surge post-2021</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">25,982</div>
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

      {/* Architecture Callout */}
      <section className="py-20 px-8 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex-1">
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Architecture</span>
              <h3 className="text-2xl font-bold mt-2 mb-3">GPU-Accelerated Pipeline</h3>
              <p className="text-white/50">
                From NVIDIA DGX Spark development to Jetson AGX Orin edge deployment. On-device LLM inference, and real-time spatial queries.
              </p>
            </div>
            <Link
              href="/about"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-colors whitespace-nowrap"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
            <a
              href="mailto:undervolt-team@aisoft.us"
              className="px-6 py-3 text-white/70 hover:text-white transition-colors"
            >
              Get in Touch
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
