"use client";

import { useMemo, useState } from "react";
import ActivityCard from "@/components/shared/ActivityCard";
import type { Activity } from "@/types";

export default function ActivitiesCatalog({ activities }: { activities: Activity[] }) {
  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(activities.map((activity) => activity.category)))],
    [activities],
  );
  const [active, setActive] = useState("Todas");
  const filtered = active === "Todas" ? activities : activities.filter((activity) => activity.category === active);

  return (
    <div>
      <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActive(category)}
            className={`shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] transition ${
              active === category
                ? "border-jungle-700 bg-jungle-700 text-white"
                : "border-ink/10 bg-white text-ink/55 hover:border-jungle-500 hover:text-jungle-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-ink/15 py-12 text-center text-sm text-ink/45">
          No hay experiencias en esta categoría por ahora.
        </p>
      )}
    </div>
  );
}
