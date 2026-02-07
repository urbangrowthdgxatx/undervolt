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

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Urban infrastructure intelligence
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-8 max-w-2xl mx-auto">
              GPU-accelerated analysis of 2.34M Austin construction permits. Discover energy trends, grid gaps, and infrastructure patterns.
            </p>
            <div className="flex items-center justify-center gap-4">
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
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Problem Section */}
      <section className="py-24 px-8 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
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
          <p className="text-white/50 text-lg mb-8 max-w-2xl mx-auto">
            Solar installations, EV chargers, generators, and grid infrastructure patterns revealed through permit data analysis.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
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
          <div className="flex items-center justify-center gap-4 mb-10">
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
