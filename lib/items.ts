import "server-only";
import { userFetch } from "@/lib/auth";
import type { Product } from "@/lib/catalog";
import {
  digits,
  oneOf,
  text,
  toSearch,
  type Page,
  type SearchParams,
} from "@/lib/query";
import type { PersonSummary, Site } from "@/lib/sites";

// ItemStatus in nest-ims; requests, shipments and issues will add more.
export const itemStatuses = ["available"] as const;

export type Item = {
  id: number;
  code: string;
  productId: number;
  product: Omit<Product, "category" | "createdBy">;
  siteId: number;
  site: Omit<Site, "incharge" | "createdBy">;
  status: string;
  // null for consumables.
  condition: number | null;
  serialNumber: string | null;
  // "YYYY-MM-DD", calibrated products only.
  nextCalibrationDueAt: string | null;
  note: string | null;
  createdAt: string;
  createdBy: PersonSummary | null;
};

export type Movement = {
  id: number;
  action: string;
  site: Pick<Site, "id" | "name" | "code">;
  status: string;
  conditionBefore: number | null;
  conditionAfter: number | null;
  note: string | null;
  performedBy: PersonSummary | null;
  createdAt: string;
};

export type StockRow = {
  productId: number;
  productName: string;
  prefix: string;
  siteId: number;
  siteName: string;
  status: string;
  count: number;
};

export type ItemQuery = {
  search?: string;
  productId?: string;
  categoryId?: string;
  siteId?: string;
  status?: string;
  page?: string;
  limit?: string;
};

export type StockQuery = Omit<ItemQuery, "search">;

export function parseStockQuery(params: SearchParams): StockQuery {
  return {
    productId: digits(params.productId),
    categoryId: digits(params.categoryId),
    siteId: digits(params.siteId),
    status: oneOf(params.status, itemStatuses),
    page: digits(params.page),
  };
}

export function parseItemQuery(params: SearchParams): ItemQuery {
  return { search: text(params.search, 100), ...parseStockQuery(params) };
}

export function listItems(query: ItemQuery) {
  return userFetch<Page<Item>>(`/items${toSearch(query)}`);
}

export function getItem(id: string) {
  return userFetch<Item>(`/items/${id}`);
}

export function listMovements(id: string, page?: string) {
  return userFetch<Page<Movement>>(
    `/items/${id}/movements${toSearch({ page })}`,
  );
}

export function getStock(query: StockQuery) {
  return userFetch<Page<StockRow>>(`/items/stock${toSearch(query)}`);
}
