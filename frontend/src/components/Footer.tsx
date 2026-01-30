"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-white/5 bg-black">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 text-white/40">
            <Zap className="w-4 h-4" />
            <span className="font-medium">Undervolt</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <Link href="/dashboard" className="hover:text-white/70 transition-colors">Map</Link>
            <Link href="/story" className="hover:text-white/70 transition-colors">Ask</Link>
            <Link href="/about" className="hover:text-white/70 transition-colors">About</Link>
          </div>

          {/* Contact */}
          <a
            href="mailto:undervolt-team@aisoft.us"
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            undervolt-team@aisoft.us
          </a>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <div>
            Built on NVIDIA DGX Spark · Deployed on Jetson AGX Orin
          </div>
          <a
            href="https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/50 transition-colors"
          >
            Data: Austin Open Data
          </a>
        </div>
      </div>
    </footer>
  );
}
