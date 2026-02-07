"use client";

import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/explore" className="text-white/40 hover:text-white transition-colors">Explore</Link></li>
              <li><Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">Map</Link></li>
              <li><Link href="/story" className="text-white/40 hover:text-white transition-colors">Ask AI</Link></li>
              <li><Link href="/reports" className="text-white/40 hover:text-white transition-colors">Reports</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-white/40 hover:text-white transition-colors">About</Link></li>
              <li><a href="https://github.com/urbangrowthdgxatx/undervolt" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">GitHub</a></li>
              <li><a href="https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">Data Source</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="text-white/40 hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-white/40 hover:text-white transition-colors">Terms</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Connect</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="mailto:undervolt-team@aisoft.us" className="text-white/40 hover:text-white transition-colors">Contact</a></li>
              <li>
                <a href="https://github.com/urbangrowthdgxatx/undervolt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                  <Github className="w-4 h-4" />
                  <span>Star on GitHub</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/40">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fbbf24" />
            </svg>
            <span className="text-sm">Undervolt</span>
          </div>
          <p className="text-white/30 text-xs">
            Open source under MIT License
          </p>
          <p className="text-white/30 text-xs">
            Built with NVIDIA Jetson
          </p>
        </div>
      </div>
    </footer>
  );
}
