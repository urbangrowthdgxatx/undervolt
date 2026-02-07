"use client";

interface InsightCardProps {
  title?: string;
  children: React.ReactNode;
}

export function InsightCard({ title = "Summary", children }: InsightCardProps) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
      <h4 className="text-sm text-white/70 mb-2">{title}</h4>
      <div className="text-sm text-white leading-relaxed">{children}</div>
    </div>
  );
}
