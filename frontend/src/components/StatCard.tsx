"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  sublabel?: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  footer?: string;
}

export function StatCard({
  icon: Icon,
  label,
  sublabel,
  value,
  change,
  changeType = "neutral",
  footer,
}: StatCardProps) {
  const changeColor = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-white/70",
  }[changeType];

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 hover:border-[#333] transition-colors">
      <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </div>

      {sublabel && (
        <p className="text-white/50 text-xs mb-3">{sublabel}</p>
      )}

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-light tracking-tight">{value}</span>
        {change && (
          <span className={`text-sm ${changeColor}`}>{change}</span>
        )}
      </div>

      {footer && (
        <p className="text-white/50 text-xs mt-2">{footer}</p>
      )}
    </div>
  );
}
