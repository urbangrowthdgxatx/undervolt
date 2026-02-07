"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Menu, X } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Map" },
    { href: "/story", label: "Ask AI" },
    { href: "/reports", label: "Reports" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fbbf24" />
          </svg>
          <span className="text-white font-medium">Undervolt</span>
        </Link>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors ${
                  isActive ? "text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right - GitHub + CTA (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/urbangrowthdgxatx/undervolt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <Link
            href="/explore"
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white/60 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-white/5">
          <div className="px-6 py-4 space-y-4">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white/70 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/5 flex items-center gap-4">
              <a
                href="https://github.com/urbangrowthdgxatx/undervolt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50"
              >
                <Github className="w-5 h-5" />
              </a>
              <Link
                href="/explore"
                className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
