import { humanize } from "@/lib/format";

// Shared by server code and the browser. StockRequestStatus in nest-ims.
export const requestStatuses = [
  "draft",
  "pending_review",
  "pending_approval",
  "approved",
  "in_transit",
  "partially_fulfilled",
  "fulfilled",
  "rejected",
  "cancelled",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

const statuses: Record<
  string,
  { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "Waiting for HQ review", tone: "warning" },
  pending_approval: { label: "Waiting for manager approval", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  in_transit: { label: "In transit", tone: "info" },
  partially_fulfilled: { label: "Partly received", tone: "info" },
  fulfilled: { label: "Fulfilled", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const requestStatusLabel = (value: string) =>
  statuses[value]?.label ?? humanize(value);

export const requestStatusTone = (value: string) =>
  statuses[value]?.tone ?? "neutral";

export const deliveryStatuses: readonly string[] = [
  "approved",
  "in_transit",
  "partially_fulfilled",
  "fulfilled",
];

// Read after the person's name: "Asha Rao approved it at HQ review".
const events: Record<string, string> = {
  created: "started the request",
  updated: "edited the draft",
  submitted: "sent it to HQ",
  quantity_changed: "changed a quantity",
  reviewed: "approved it at HQ review",
  approved: "gave the final approval",
  rejected: "rejected the request",
  cancelled: "cancelled the request",
  dispatched: "dispatched a package",
  received: "received items",
  items_missing: "reported items missing",
  closed: "closed the request",
};

export const requestEventLabel = (value: string) =>
  events[value] ?? humanize(value).toLowerCase();

// The number people quote: SR-000042.
export const requestCode = (id: number) => `SR-${String(id).padStart(6, "0")}`;
