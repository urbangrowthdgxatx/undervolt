"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Map, Sparkles } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Intro", icon: Sparkles },
    { href: "/story", label: "Story Builder", icon: BookOpen },
    { href: "/dashboard", label: "Map & Chat", icon: Map },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-6 pointer-events-auto">
          <h1 className="text-lg font-light tracking-widest text-white/40 hover:text-white/70 transition-colors cursor-default">
            UNDERVOLT
          </h1>
          <div className="flex gap-4">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 text-sm transition-colors
                    ${
                      isActive
                        ? "text-white"
                        : "text-white/40 hover:text-white/70"
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
      </div>
    </nav>
  );
}
