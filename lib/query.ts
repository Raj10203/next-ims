export type SearchParams = Record<string, string | string[] | undefined>;

export type Query = Record<string, string | undefined>;

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const digits = (value: string | string[] | undefined) => {
  const text = first(value);
  return text && /^\d+$/.test(text) && Number(text) > 0 ? text : undefined;
};

export const text = (value: string | string[] | undefined, max: number) =>
  first(value)?.trim().slice(0, max) || undefined;

export function oneOf<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
) {
  const text = first(value) as T;
  return allowed.includes(text) ? text : undefined;
}

export const booleans = ["true", "false"] as const;

export function toSearch(query: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

export const isFiltered = (query: Query) =>
  Object.entries(query).some(([key, value]) => key !== "page" && !!value);
