import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/ui/Icon";

export default function AdminStatCard({
  icon,
  label,
  value,
  sub,
  accent = "jungle",
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "jungle" | "lime" | "sun" | "ink";
}) {
  const colors = {
    jungle: "bg-jungle-50 text-jungle-700",
    lime: "bg-lime-100 text-jungle-700",
    sun: "bg-sun-100 text-yellow-800",
    ink: "bg-ink/5 text-ink/60",
  };

  return (
    <div className="admin-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-ink/35">{label}</p>
          <p className="mt-2 font-display text-3xl leading-none text-ink">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors[accent]}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      {sub && <div className="mt-3 text-[11px] text-ink/40">{sub}</div>}
    </div>
  );
}
