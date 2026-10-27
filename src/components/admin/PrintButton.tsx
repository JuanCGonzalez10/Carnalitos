"use client";

import Icon from "@/components/ui/Icon";

export default function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline btn-sm">
      <Icon name="receipt" className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
