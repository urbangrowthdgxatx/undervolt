"use client";

import {
  LayoutDashboard,
  Zap,
  Home,
  TrendingUp,
  Map,
  Settings,
  Battery
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: Zap, label: "EV & Solar", href: "/electrification" },
  { icon: Home, label: "Housing Density", href: "/density" },
  { icon: Battery, label: "Grid Resilience", href: "/resilience" },
  { icon: Map, label: "Map View", href: "/map" },
  { icon: TrendingUp, label: "Trends", href: "/trends" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-14 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col items-center py-4 gap-2">
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-4">
        <span className="text-sm font-bold">AI</span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              title={item.label}
            >
              <item.icon size={20} />
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <Link
        href="/settings"
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        title="Settings"
      >
        <Settings size={20} />
      </Link>
    </div>
  );
}
