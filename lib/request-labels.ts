import { humanize } from "@/lib/format";

// Shared by server code and the browser. StockRequestStatus in nest-ims;
// dispatch and receipt will add more.
export const requestStatuses = [
  "pending_review",
  "pending_approval",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

const statuses: Record<
  string,
  { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }
> = {
  pending_review: { label: "Waiting for HQ review", tone: "warning" },
  pending_approval: { label: "Waiting for manager approval", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const requestStatusLabel = (value: string) =>
  statuses[value]?.label ?? humanize(value);

export const requestStatusTone = (value: string) =>
  statuses[value]?.tone ?? "neutral";

// Read after the person's name: "Asha Rao approved it at HQ review".
const events: Record<string, string> = {
  created: "raised the request",
  quantity_changed: "changed a quantity",
  reviewed: "approved it at HQ review",
  approved: "gave the final approval",
  rejected: "rejected the request",
  cancelled: "cancelled the request",
};

export const requestEventLabel = (value: string) =>
  events[value] ?? humanize(value).toLowerCase();

// The number people quote: SR-000042.
export const requestCode = (id: number) => `SR-${String(id).padStart(6, "0")}`;
