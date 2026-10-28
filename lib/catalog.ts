import "server-only";
import { userFetch } from "@/lib/auth";
import {
  booleans,
  digits,
  oneOf,
  text,
  toSearch,
  type Page,
  type SearchParams,
} from "@/lib/query";
import type { PersonSummary } from "@/lib/sites";

export type Category = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: PersonSummary | null;
};

export type Product = {
  id: number;
  name: string;
  prefix: string;
  categoryId: number;
  category: Omit<Category, "createdBy">;
  type: string;
  measureType: string;
  packSize: number | null;
  packUnit: string | null;
  calibrationIntervalDays: number | null;
  description: string | null;
  isActive: boolean;
  lastItemNumber: number;
  createdAt: string;
  createdBy: PersonSummary | null;
};

export type ProductOptions = {
  types: string[];
  measureTypes: string[];
  packUnits: string[];
};

export type CategoryQuery = {
  search?: string;
  isActive?: string;
  page?: string;
  limit?: string;
};

export type ProductQuery = CategoryQuery & {
  categoryId?: string;
  type?: string;
  measureType?: string;
};

export function parseCategoryQuery(params: SearchParams): CategoryQuery {
  return {
    search: text(params.search, 100),
    isActive: oneOf(params.isActive, booleans),
    page: digits(params.page),
  };
}

// type and measureType are checked by the API (400), so any value the
// options list offers stays usable here.
export function parseProductQuery(params: SearchParams): ProductQuery {
  return {
    search: text(params.search, 150),
    categoryId: digits(params.categoryId),
    type: text(params.type, 30),
    measureType: text(params.measureType, 30),
    isActive: oneOf(params.isActive, booleans),
    page: digits(params.page),
  };
}

export function listCategories(query: CategoryQuery = {}) {
  return userFetch<Page<Category>>(`/categories${toSearch(query)}`);
}

export function getCategory(id: string) {
  return userFetch<Category>(`/categories/${id}`);
}

export function listProducts(query: ProductQuery = {}) {
  return userFetch<Page<Product>>(`/products${toSearch(query)}`);
}

export function getProduct(id: string) {
  return userFetch<Product>(`/products/${id}`);
}

export function getProductOptions() {
  return userFetch<ProductOptions>("/products/options");
}
