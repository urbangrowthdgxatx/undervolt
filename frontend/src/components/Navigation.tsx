"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Map, MessageCircle, Info, Github, Compass, FileText, Menu, X } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", icon: Sparkles },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/dashboard", label: "Map", icon: Map },
    { href: "/story", label: "Ask", icon: MessageCircle },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left - Logo */}
        <Link href="/" className="text-lg font-light tracking-widest text-white/50 hover:text-white transition-colors">
          UNDERVOLT
        </Link>

        {/* Center - Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${isActive ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10"}
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right - GitHub (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/urbangrowthdgxatx/undervolt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white/60 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10">
          <div className="px-4 py-4 space-y-2">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all
                    ${isActive ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10"}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <a href="https://lu.ma/aitxhackathon" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-amber-400 text-sm hover:text-amber-300">
                <span>🏆</span>
                <span>1st Place - NVIDIA DGX AITX</span>
              </a>
              <a
                href="https://github.com/urbangrowthdgxatx/undervolt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
