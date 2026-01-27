"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Brain, Map, Sparkles } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Intro", icon: Sparkles },
    { href: "/story", label: "Story Builder", icon: BookOpen },
    { href: "/dashboard", label: "Map & Chat", icon: Map },
    { href: "/methodology", label: "ML Pipeline", icon: Brain },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-center gap-8 px-6 py-3">
        <Link href="/" className="text-lg font-light tracking-widest text-white/50 hover:text-white transition-colors">
          UNDERVOLT
        </Link>
        <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${
                    isActive
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
