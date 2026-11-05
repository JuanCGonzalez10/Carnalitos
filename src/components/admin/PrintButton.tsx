"use client";

import Icon from "@/components/ui/Icon";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline btn-sm">
      <Icon name="download" className="h-3.5 w-3.5" /> Imprimir reporte
    </button>
  );
}
