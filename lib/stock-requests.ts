import "server-only";
import { userFetch } from "@/lib/auth";
import type { Product } from "@/lib/catalog";
import type { Movement } from "@/lib/items";
import {
  booleans,
  digits,
  oneOf,
  toSearch,
  type Page,
  type SearchParams,
} from "@/lib/query";
import type { PersonSummary, Site } from "@/lib/sites";
import { requestStatuses, type RequestStatus } from "@/lib/request-labels";

export type StockRequest = {
  id: number;
  siteId: number;
  site: Omit<Site, "incharge" | "createdBy">;
  status: RequestStatus;
  note: string | null;
  // "YYYY-MM-DD"
  neededBy: string | null;
  createdAt: string;
  requestedBy: PersonSummary | null;
  reviewedBy: PersonSummary | null;
  reviewedAt: string | null;
  approvedBy: PersonSummary | null;
  approvedAt: string | null;
  closedBy: PersonSummary | null;
  closedAt: string | null;
};

export type RequestRow = StockRequest & {
  lineCount: number;
  totalQuantity: number;
};

export type RequestLine = {
  id: number;
  productId: number;
  product: Omit<Product, "category" | "createdBy">;
  requestedQuantity: number;
  quantity: number;
};

// allowed comes from nest-ims, which applies the review chain's rules.
export type RequestDetail = StockRequest & {
  lines: RequestLine[];
  allowed: { decide: boolean; cancel: boolean };
};

export type RequestEvent = {
  id: number;
  action: string;
  status: RequestStatus;
  product: Pick<Product, "id" | "name" | "prefix"> | null;
  quantityBefore: number | null;
  quantityAfter: number | null;
  note: string | null;
  performedBy: PersonSummary | null;
  createdAt: string;
};

export type RequestComment = {
  id: number;
  parentId: number | null;
  body: string;
  author: PersonSummary | null;
  createdAt: string;
};

export type RequestQuery = {
  status?: string;
  siteId?: string;
  mine?: string;
  awaitingMe?: string;
  page?: string;
};

export function parseRequestQuery(params: SearchParams): RequestQuery {
  return {
    status: oneOf(params.status, requestStatuses),
    siteId: digits(params.siteId),
    mine: oneOf(params.mine, booleans),
    page: digits(params.page),
  };
}

export function listRequests(query: RequestQuery & { limit?: string }) {
  return userFetch<Page<RequestRow>>(`/stock-requests${toSearch(query)}`);
}

export function getRequest(id: string) {
  return userFetch<RequestDetail>(`/stock-requests/${id}`);
}

export function listRequestEvents(id: string) {
  return userFetch<RequestEvent[]>(`/stock-requests/${id}/events`);
}

export function listRequestComments(id: string) {
  return userFetch<RequestComment[]>(`/stock-requests/${id}/comments`);
}

// Every item's movements (GET /items/movements), for the logistics log.
export type LoggedMovement = Movement & {
  item: { id: number; code: string; productId: number };
};

export const movementActions = ["added", "condition_changed"] as const;

export type MovementQuery = {
  siteId?: string;
  productId?: string;
  action?: string;
  page?: string;
};

export function parseMovementQuery(params: SearchParams): MovementQuery {
  return {
    siteId: digits(params.siteId),
    productId: digits(params.productId),
    action: oneOf(params.action, movementActions),
    page: digits(params.page),
  };
}

export function listMovementLog(query: MovementQuery) {
  return userFetch<Page<LoggedMovement>>(`/items/movements${toSearch(query)}`);
}
