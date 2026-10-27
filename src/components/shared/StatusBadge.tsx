import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils/format";

export function StatusBadge({ status, type = "booking" }: { status: string; type?: "booking" | "payment" }) {
  const label = type === "payment" ? PAYMENT_STATUS_LABELS[status] ?? status : BOOKING_STATUS_LABELS[status] ?? status;
  return <span className={`status-${status}`}>{label}</span>;
}
