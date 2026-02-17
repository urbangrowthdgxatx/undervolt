"use client";

import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-black">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/explore" className="text-white/60 hover:text-white transition-colors">Explore</Link></li>
              <li><Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">Map</Link></li>
              <li><Link href="/story" className="text-white/60 hover:text-white transition-colors">Ask AI</Link></li>
              <li><Link href="/reports" className="text-white/60 hover:text-white transition-colors">Reports</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">About</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about#how" className="text-white/60 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/about#stack" className="text-white/60 hover:text-white transition-colors">Tech Stack</Link></li>
              <li><Link href="/about#story" className="text-white/60 hover:text-white transition-colors">Origin Story</Link></li>
              <li><Link href="/about#roadmap" className="text-white/60 hover:text-white transition-colors">Roadmap</Link></li>
              <li><Link href="/about#team" className="text-white/60 hover:text-white transition-colors">Team</Link></li>
              <li><a href="https://github.com/urbangrowthdgxatx/undervolt" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-white/60 hover:text-white transition-colors">Terms</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="text-white/60 hover:text-white transition-colors">FAQ</Link></li>
              <li>
                <a href="https://github.com/urbangrowthdgxatx/undervolt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <Github className="w-4 h-4" />
                  <span>Star on GitHub</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* AI Disclaimer + Data Credits */}
        <div className="pt-8 border-t border-white/5 mb-6">
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center space-y-2">
            <p className="text-white/50 text-xs">
              Undervolt uses AI to analyze permit data. Insights are AI-generated and may contain inaccuracies.
              Always verify critical information against{" "}
              <a href="https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu" target="_blank" rel="noopener noreferrer" className="text-white/70 underline underline-offset-2 hover:text-white transition-colors">official permit records</a>.
            </p>
            <p className="text-white/40 text-xs">
              Data sourced from{" "}
              <a href="https://data.austintexas.gov" target="_blank" rel="noopener noreferrer" className="text-white/60 underline underline-offset-2 hover:text-white transition-colors">City of Austin Open Data Portal</a>
              {" "}under public domain. Not affiliated with the City of Austin.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-white/60">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fbbf24" />
            </svg>
            <span className="text-sm font-semibold">Undervolt</span>
            <span className="text-white/30 text-[10px] font-mono">
              {(process.env.NEXT_PUBLIC_COMMIT || "dev").slice(0, 7)}
            </span>
          </div>
          <p className="text-white/50 text-xs">
            Open source under MIT License
          </p>
          <p className="text-white/50 text-xs">
            Built on DGX Spark · Deployed on Jetson · Powered by Nemotron via NIM
          </p>
        </div>
      </div>
    </footer>
  );
}
