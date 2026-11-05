import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils/format";

export function StatusBadge({ status, type = "order" }: { status: string; type?: "order" | "payment" }) {
  const label =
    type === "payment" ? PAYMENT_STATUS_LABELS[status] ?? status : ORDER_STATUS_LABELS[status] ?? status;
  return <span className={`status-${status}`}>{label}</span>;
}
