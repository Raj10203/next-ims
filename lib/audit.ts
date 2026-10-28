import "server-only";
import { userFetch } from "@/lib/auth";
import {
  digits,
  oneOf,
  text,
  toSearch,
  type Page,
  type SearchParams,
} from "@/lib/query";

export const auditActions = ["create", "update", "delete"] as const;

// The entity class names nest-ims audits. The filter offers these, but any
// value in the URL is passed on.
export const auditEntityTypes = [
  "User",
  "UserFeatureRole",
  "Site",
  "Category",
  "Product",
  "Item",
];

export type AuditLog = {
  id: string;
  createdAt: string;
  action: (typeof auditActions)[number];
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  actorId: number | null;
  actorRole: string | null;
  ip: string | null;
};

export type AuditQuery = {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  page?: string;
};

export function parseAuditQuery(params: SearchParams): AuditQuery {
  return {
    entityType: text(params.entityType, 50),
    entityId: text(params.entityId, 64),
    actorId: digits(params.actorId),
    action: oneOf(params.action, auditActions),
    page: digits(params.page),
  };
}

export function listAuditLogs(query: AuditQuery) {
  return userFetch<Page<AuditLog>>(`/audit-logs${toSearch(query)}`);
}

export function entityPath(entityType: string, entityId: string) {
  if (!/^\d+$/.test(entityId)) return null;
  const base: Record<string, string> = {
    User: "/people",
    Site: "/sites",
    Category: "/inventory/categories",
    Product: "/inventory/products",
    Item: "/inventory",
  };
  return base[entityType] ? `${base[entityType]}/${entityId}` : null;
}

export function historyHref(entityType: string, id: number | string) {
  return `/audit${toSearch({ entityType, entityId: String(id) })}`;
}
